-- ============================================================================
-- 001 — Signing in with a username
-- ============================================================================
-- To apply this to an existing Supabase database: paste it into the SQL Editor
-- and run it. New installations do not need it; section 6 of schema.sql covers
-- the same ground. Running it again is safe (idempotent).
--
-- CHECK FIRST — if this query returns rows, some accounts share a username
-- that differs only in case and the index below cannot be created. Change one
-- of those usernames first:
--
--   select lower(username) as username, count(*)
--   from public.profiles
--   where username is not null
--   group by lower(username)
--   having count(*) > 1;
-- ============================================================================

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- Username -> account id (NOT the email address). Only service_role may
-- execute it: granted to anon or authenticated, anyone could call it through
-- PostgREST. service_role already bypasses RLS, so security
-- definer gerekmiyor.
create or replace function public.user_id_for_username(p_username text)
returns uuid
language sql
stable
set search_path = ''
as $$
  select id from public.profiles where lower(username) = lower(p_username)
$$;

revoke all on function public.user_id_for_username(text) from public, anon, authenticated;
grant execute on function public.user_id_for_username(text) to service_role;

-- Refresh the schema cache so PostgREST picks the new function up right away.
notify pgrst, 'reload schema';
