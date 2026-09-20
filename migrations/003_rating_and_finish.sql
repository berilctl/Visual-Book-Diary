-- ============================================================================
-- 003 — Rating and finish date
-- ============================================================================
-- To apply this to an existing Supabase database: paste it into the SQL Editor
-- and run it. New installations do not need it; the books table in schema.sql
-- already has the columns. Running it again is safe (idempotent).
--
-- No new RLS policy is needed: the "own books" policy covers every operation.
-- ============================================================================

-- 1–5 stars. NULL means unrated. The range is enforced in the database too.
alter table public.books
  add column if not exists rating smallint check (rating between 1 and 5);

-- The day the book was marked as finished, in the user's local date. The reading stats use it.
alter table public.books
  add column if not exists finished_at date;

-- Refresh the schema cache so PostgREST picks the new columns up right away.
notify pgrst, 'reload schema';
