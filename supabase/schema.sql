-- Bolo — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
--
-- Before running:
--   Authentication → Sign In / Providers → Email: enabled, "Allow anonymous sign-ins": off.
--   Authentication → URL Configuration → add your site's /auth/callback to Redirect URLs
--   (e.g. http://localhost:3000/auth/callback). Confirmation and reset emails land there.
--   Learners sign in with email and password; every row is scoped to auth.uid().
--
-- Security model:
--   * Row Level Security is on for every table.
--   * Learners can read only their own rows.
--   * Progress, points and words are written only through security-definer
--     functions (complete_lesson, consume_ai_quota) that validate their input,
--     so a learner cannot set arbitrary points or stars.
--   * Restrictive policies refuse anonymous sessions, so only email accounts get in
--     even if anonymous sign-ins are switched on by mistake.
--   * The shared lesson cache (public.lessons) has no policies at all; only the
--     server, using the secret key, can read or write it.

-- The languages Bolo teaches (every one is also a language a learner can speak).
-- Keep in sync with lib/languages.ts. To add a language later, replace this
-- function; the constraints below follow it.
create or replace function public.supported_langs()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'pl', 'ru', 'el', 'tr', 'ja', 'ko', 'zh', 'vi', 'th', 'id', 'ar', 'sw', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'ur', 'kn', 'ml']::text[]
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 40),
  native_lang  text not null default 'en'
               check (native_lang = any (public.supported_langs())),
  target_lang  text
               check (target_lang = any (public.supported_langs())),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint profiles_langs_differ check (target_lang is null or target_lang <> native_lang)
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- Courses: one row per learner per language they study
-- ---------------------------------------------------------------------------
create table public.courses (
  user_id     uuid not null references auth.users (id) on delete cascade,
  target_lang text not null check (target_lang = any (public.supported_langs())),
  level       smallint not null default 1 check (level between 1 and 3),
  points      integer not null default 0 check (points >= 0),
  created_at  timestamptz not null default now(),
  primary key (user_id, target_lang)
);

alter table public.courses enable row level security;

create policy "courses: read own" on public.courses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "courses: insert own" on public.courses
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "courses: update own" on public.courses
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Learners may set their level, but never their points.
revoke insert, update on public.courses from anon, authenticated;
grant insert (user_id, target_lang, level) on public.courses to authenticated;
grant update (level) on public.courses to authenticated;

-- ---------------------------------------------------------------------------
-- Progress tables (read-only for learners; written by complete_lesson)
-- ---------------------------------------------------------------------------
create table public.unit_progress (
  user_id           uuid not null references auth.users (id) on delete cascade,
  target_lang       text not null check (target_lang = any (public.supported_langs())),
  unit_id           text not null check (unit_id ~ '^[a-z_]{1,32}$'),
  stars             smallint not null default 0 check (stars between 0 and 3),
  completions       integer not null default 0 check (completions >= 0),
  last_completed_at timestamptz,
  primary key (user_id, target_lang, unit_id)
);

create table public.lesson_attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  target_lang text not null check (target_lang = any (public.supported_langs())),
  unit_id     text not null check (unit_id ~ '^[a-z_]{1,32}$'),
  correct     smallint not null check (correct >= 0),
  total       smallint not null check (total between 1 and 20),
  stars       smallint not null check (stars between 0 and 3),
  points      smallint not null check (points >= 0),
  created_at  timestamptz not null default now(),
  check (correct <= total)
);

create index lesson_attempts_user_created_idx
  on public.lesson_attempts (user_id, created_at desc);

create table public.learned_words (
  user_id       uuid not null references auth.users (id) on delete cascade,
  target_lang   text not null check (target_lang = any (public.supported_langs())),
  word          text not null check (char_length(word) between 1 and 80),
  meaning       text not null check (char_length(meaning) between 1 and 120),
  unit_id       text not null check (unit_id ~ '^[a-z_]{1,32}$'),
  first_seen_at timestamptz not null default now(),
  primary key (user_id, target_lang, word)
);

alter table public.unit_progress   enable row level security;
alter table public.lesson_attempts enable row level security;
alter table public.learned_words   enable row level security;

create policy "unit_progress: read own" on public.unit_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "lesson_attempts: read own" on public.lesson_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "learned_words: read own" on public.learned_words
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.unit_progress, public.lesson_attempts, public.learned_words
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Shared cache of AI-generated lesson content (server-only)
-- ---------------------------------------------------------------------------
create table public.lessons (
  id          bigint generated always as identity primary key,
  target_lang text not null check (target_lang = any (public.supported_langs())),
  native_lang text not null check (native_lang = any (public.supported_langs())),
  unit_id     text not null check (unit_id ~ '^[a-z_]{1,32}$'),
  level       smallint not null check (level between 1 and 3),
  content     jsonb not null,
  created_at  timestamptz not null default now(),
  unique (target_lang, native_lang, unit_id, level)
);

-- RLS on with no policies: only the secret (service role) key can touch it.
alter table public.lessons enable row level security;
revoke all on public.lessons from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Daily AI usage counter (keeps the AI endpoints from being abused)
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default current_date,
  count   integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

create policy "ai_usage: read own" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.ai_usage from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Email accounts only (also in migrations/002_email_accounts_only.sql)
-- ---------------------------------------------------------------------------
create policy "email accounts only" on public.profiles as restrictive
  for all to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

create policy "email accounts only" on public.courses as restrictive
  for all to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

create policy "email accounts only" on public.unit_progress as restrictive
  for select to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

create policy "email accounts only" on public.lesson_attempts as restrictive
  for select to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

create policy "email accounts only" on public.learned_words as restrictive
  for select to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

create policy "email accounts only" on public.ai_usage as restrictive
  for select to authenticated
  using (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- Records one AI call for the current learner. Returns false once the daily
-- limit is reached.
create or replace function public.consume_ai_quota(p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 1000 then
    raise exception 'invalid limit' using errcode = '22023';
  end if;

  insert into public.ai_usage as u (user_id, day, count)
  values (v_uid, current_date, 1)
  on conflict (user_id, day) do update set count = u.count + 1
  returning u.count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Saves a finished lesson: the attempt, the best stars for the unit, the new
-- words, and the points. Stars and points are computed here, not trusted from
-- the client. Keep in sync with lib/progress.ts.
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
      insert into public.learned_words (user_id, target_lang, word, meaning, unit_id)
      values (v_uid, p_target_lang, v_word->>'word', v_word->>'meaning', p_unit_id)
      on conflict do nothing;
      get diagnostics v_inserted = row_count;
      v_new_words := v_new_words + v_inserted;
    end if;
  end loop;

  return query select v_stars, v_points, v_new_words, v_total;
end;
$$;

revoke all on function public.consume_ai_quota(integer) from public, anon;
revoke all on function public.complete_lesson(text, text, integer, integer, jsonb) from public, anon;
grant execute on function public.consume_ai_quota(integer) to authenticated;
grant execute on function public.complete_lesson(text, text, integer, integer, jsonb) to authenticated;
