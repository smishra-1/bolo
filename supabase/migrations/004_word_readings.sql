-- Show readings (romanization) in English letters for learned words. Run once
-- on a project created from an earlier schema.sql (schema.sql already includes
-- this for new projects).

alter table public.learned_words
  add column if not exists romanization text check (char_length(romanization) between 1 and 80);

-- Same body as schema.sql: stores the reading sent with each word.
create or replace function public.complete_lesson(
  p_target_lang text,
  p_unit_id     text,
  p_correct     integer,
  p_total       integer,
  p_words       jsonb
)
returns table (stars smallint, points smallint, new_words integer, total_points integer)
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
  v_new_words integer := 0;
  v_total     integer;
  v_word      jsonb;
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
  if p_total is null or p_total < 1 or p_total > 20
     or p_correct is null or p_correct < 0 or p_correct > p_total then
    raise exception 'invalid score' using errcode = '22023';
  end if;
  if p_words is null or jsonb_typeof(p_words) <> 'array' or jsonb_array_length(p_words) > 12 then
    raise exception 'invalid words' using errcode = '22023';
  end if;

  v_ratio := p_correct::numeric / p_total;
  v_stars := case
    when v_ratio >= 0.9 then 3
    when v_ratio >= 0.6 then 2
    when p_correct > 0  then 1
    else 0
  end;
  v_points := p_correct * 5 + case when v_stars = 3 then 10 else 0 end;

  insert into public.lesson_attempts (user_id, target_lang, unit_id, correct, total, stars, points)
  values (v_uid, p_target_lang, p_unit_id, p_correct, p_total, v_stars, v_points);

  insert into public.unit_progress as up (user_id, target_lang, unit_id, stars, completions, last_completed_at)
  values (v_uid, p_target_lang, p_unit_id, v_stars, 1, now())
  on conflict (user_id, target_lang, unit_id) do update
    set stars = greatest(up.stars, excluded.stars),
        completions = up.completions + 1,
        last_completed_at = now();

  insert into public.courses as c (user_id, target_lang, points)
  values (v_uid, p_target_lang, v_points)
  on conflict (user_id, target_lang) do update set points = c.points + excluded.points
  returning c.points into v_total;

  for v_word in select * from jsonb_array_elements(p_words) loop
    if jsonb_typeof(v_word->'word') = 'string' and jsonb_typeof(v_word->'meaning') = 'string'
       and char_length(v_word->>'word') between 1 and 80
       and char_length(v_word->>'meaning') between 1 and 120 then
      v_roman := nullif(btrim(v_word->>'romanization'), '');
      if v_roman is not null and char_length(v_roman) > 80 then
        v_roman := null;
      end if;
      insert into public.learned_words (user_id, target_lang, word, meaning, romanization, unit_id)
      values (v_uid, p_target_lang, v_word->>'word', v_word->>'meaning', v_roman, p_unit_id)
      on conflict do nothing;
      get diagnostics v_inserted = row_count;
      -- Words learned before readings existed get theirs the next time they appear.
      if v_inserted = 0 and v_roman is not null then
        update public.learned_words
           set romanization = v_roman
         where user_id = v_uid and target_lang = p_target_lang
           and word = v_word->>'word' and romanization is null;
      end if;
      v_new_words := v_new_words + v_inserted;
    end if;
  end loop;

  return query select v_stars, v_points, v_new_words, v_total;
end;
$$;

grant execute on function public.complete_lesson(text, text, integer, integer, jsonb) to authenticated;
