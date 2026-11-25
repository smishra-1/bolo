-- Words, then sentences, then a test. Run once on a project created from an
-- earlier schema.sql (schema.sql already includes this for new projects).
-- This file is self-contained: it also adds the readings column from
-- 004_word_readings.sql, so you only need to run this one.
--
-- Every unit now has three parts. Stars are kept per part, completed sentences
-- are saved for the Practice tab, and complete_lesson takes the part.
-- Progress made before this change counts as the "words" part.

alter table public.learned_words
  add column if not exists romanization text check (char_length(romanization) between 1 and 80);

alter table public.unit_progress
  add column if not exists part text not null default 'words'
  check (part in ('words', 'sentences', 'test'));
alter table public.unit_progress drop constraint unit_progress_pkey;
alter table public.unit_progress add primary key (user_id, target_lang, unit_id, part);

alter table public.lesson_attempts
  add column if not exists part text not null default 'words'
  check (part in ('words', 'sentences', 'test'));

create table public.learned_sentences (
  user_id       uuid not null references auth.users (id) on delete cascade,
  target_lang   text not null check (target_lang = any (public.supported_langs())),
  sentence      text not null check (char_length(sentence) between 1 and 200),
  meaning       text not null check (char_length(meaning) between 1 and 200),
  tokens        jsonb not null check (jsonb_typeof(tokens) = 'array' and jsonb_array_length(tokens) between 2 and 8),
  unit_id       text not null check (unit_id ~ '^[a-z_]{1,32}$'),
  first_seen_at timestamptz not null default now(),
  primary key (user_id, target_lang, sentence)
);

alter table public.learned_sentences enable row level security;

create policy "learned_sentences: read own" on public.learned_sentences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "email accounts only" on public.learned_sentences as restrictive
  for select to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

revoke insert, update, delete on public.learned_sentences from anon, authenticated;

-- The old five-argument version is replaced by one that takes the part.
drop function if exists public.complete_lesson(text, text, integer, integer, jsonb);

create or replace function public.complete_lesson(
  p_target_lang text,
  p_unit_id     text,
  p_part        text,
  p_correct     integer,
  p_total       integer,
  p_words       jsonb,
  p_sentences   jsonb
)
returns table (stars smallint, points smallint, new_items integer, total_points integer)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid       uuid := auth.uid();
  v_ratio     numeric;
  v_stars     smallint;
  v_points    smallint;
  v_new_items integer := 0;
  v_total     integer;
  v_item      jsonb;
  v_inserted  integer;
  v_roman     text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_target_lang <> all (public.supported_langs()) then
    raise exception 'invalid language' using errcode = '22023';
  end if;
  if p_unit_id !~ '^[a-z_]{1,32}$' then
    raise exception 'invalid unit' using errcode = '22023';
  end if;
  if p_part is null or p_part not in ('words', 'sentences', 'test') then
    raise exception 'invalid part' using errcode = '22023';
  end if;
  if p_total is null or p_total < 1 or p_total > 20
     or p_correct is null or p_correct < 0 or p_correct > p_total then
    raise exception 'invalid score' using errcode = '22023';
  end if;
  if p_words is null or jsonb_typeof(p_words) <> 'array' or jsonb_array_length(p_words) > 12 then
    raise exception 'invalid words' using errcode = '22023';
  end if;
  if p_sentences is null or jsonb_typeof(p_sentences) <> 'array' or jsonb_array_length(p_sentences) > 8 then
    raise exception 'invalid sentences' using errcode = '22023';
  end if;

  v_ratio := p_correct::numeric / p_total;
  v_stars := case
    when v_ratio >= 0.9 then 3
    when v_ratio >= 0.6 then 2
    when p_correct > 0  then 1
    else 0
  end;
  v_points := p_correct * 5 + case when v_stars = 3 then 10 else 0 end;

  insert into public.lesson_attempts (user_id, target_lang, unit_id, part, correct, total, stars, points)
  values (v_uid, p_target_lang, p_unit_id, p_part, p_correct, p_total, v_stars, v_points);

  insert into public.unit_progress as up (user_id, target_lang, unit_id, part, stars, completions, last_completed_at)
  values (v_uid, p_target_lang, p_unit_id, p_part, v_stars, 1, now())
  on conflict (user_id, target_lang, unit_id, part) do update
    set stars = greatest(up.stars, excluded.stars),
        completions = up.completions + 1,
        last_completed_at = now();

  insert into public.courses as c (user_id, target_lang, points)
  values (v_uid, p_target_lang, v_points)
  on conflict (user_id, target_lang) do update set points = c.points + excluded.points
  returning c.points into v_total;

  if p_part = 'words' then
    for v_item in select * from jsonb_array_elements(p_words) loop
      if jsonb_typeof(v_item->'word') = 'string' and jsonb_typeof(v_item->'meaning') = 'string'
         and char_length(v_item->>'word') between 1 and 80
         and char_length(v_item->>'meaning') between 1 and 120 then
        v_roman := nullif(btrim(v_item->>'romanization'), '');
        if v_roman is not null and char_length(v_roman) > 80 then
          v_roman := null;
        end if;
        insert into public.learned_words (user_id, target_lang, word, meaning, romanization, unit_id)
        values (v_uid, p_target_lang, v_item->>'word', v_item->>'meaning', v_roman, p_unit_id)
        on conflict do nothing;
        get diagnostics v_inserted = row_count;
        -- Words learned before readings existed get theirs the next time they appear.
        if v_inserted = 0 and v_roman is not null then
          update public.learned_words
             set romanization = v_roman
           where user_id = v_uid and target_lang = p_target_lang
             and word = v_item->>'word' and romanization is null;
        end if;
        v_new_items := v_new_items + v_inserted;
      end if;
    end loop;
  elsif p_part = 'sentences' then
    for v_item in select * from jsonb_array_elements(p_sentences) loop
      if jsonb_typeof(v_item->'text') = 'string' and jsonb_typeof(v_item->'meaning') = 'string'
         and jsonb_typeof(v_item->'tokens') = 'array'
         and char_length(v_item->>'text') between 1 and 200
         and char_length(v_item->>'meaning') between 1 and 200
         and jsonb_array_length(v_item->'tokens') between 2 and 8 then
        insert into public.learned_sentences (user_id, target_lang, sentence, meaning, tokens, unit_id)
        values (v_uid, p_target_lang, v_item->>'text', v_item->>'meaning', v_item->'tokens', p_unit_id)
        on conflict do nothing;
        get diagnostics v_inserted = row_count;
        v_new_items := v_new_items + v_inserted;
      end if;
    end loop;
  end if;

  return query select v_stars, v_points, v_new_items, v_total;
end;
$$;

revoke all on function public.complete_lesson(text, text, text, integer, integer, jsonb, jsonb) from public, anon;
grant execute on function public.complete_lesson(text, text, text, integer, integer, jsonb, jsonb) to authenticated;
