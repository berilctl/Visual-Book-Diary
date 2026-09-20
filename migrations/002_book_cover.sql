-- ============================================================================
-- 002 — Book cover
-- ============================================================================
-- To apply this to an existing Supabase database: paste it into the SQL Editor
-- and run it. New installations do not need it; the books table in schema.sql
-- already has the column. Running it again is safe (idempotent).
--
-- No new RLS policy is needed: the "own books" policy covers every operation,
-- and cover files go into the {userId}/{bookId}/ folder of the existing
-- book-images bucket.
-- ============================================================================

alter table public.books
  add column if not exists cover_url text;

-- Refresh the schema cache so PostgREST picks the new column up right away.
notify pgrst, 'reload schema';
