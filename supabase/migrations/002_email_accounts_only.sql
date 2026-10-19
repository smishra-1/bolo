-- Email-and-password accounts only.
-- Already ran schema.sql with anonymous sign-ins? Run this file once as well.
-- (schema.sql already includes it for new projects.)
--
-- Restrictive policies are ANDed with the existing ones, so an anonymous
-- session can no longer read or write any learner table.

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

-- Optional clean-up of learners created while anonymous sign-ins were on.
-- Their rows are removed by "on delete cascade". Review before running:
-- delete from auth.users where is_anonymous;
