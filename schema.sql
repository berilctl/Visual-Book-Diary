-- ============================================================================
-- Visual Book Diary — Database Schema
-- Tables, indexes, triggers, row-level security and Storage in one file.
--
-- Paste the whole file into the Supabase SQL Editor and run it. It is written
-- to be idempotent (running it again is safe): tables use `if not exists` and
-- policies and triggers are dropped before they are created.
--
-- Order: extension -> tables -> indexes -> trigger -> RLS policies ->
-- Storage bucket and policies.
-- ============================================================================

-- For gen_random_uuid() (usually already installed on Supabase).
create extension if not exists pgcrypto;

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- profiles --------------------------------------------------------------------
-- One row per auth.users row, created automatically at sign-up by the
-- handle_new_user trigger below.
create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  updated_at  timestamptz,
  username    text
);

-- books -----------------------------------------------------------------------
create table if not exists public.books (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  title       text        not null,
  author      text        not null,
  start_date  date,
  status      text        not null default 'reading'
                          check (status in ('reading', 'completed', 'want_to_read', 'paused', 'dnf')),
  cover_url   text,                       -- cover image, a Supabase Storage public URL
  rating      smallint    check (rating between 1 and 5),  -- finished books only
  finished_at date,                       -- the day it was finished, in the user's local date
  created_at  timestamptz default now()
);

-- characters ------------------------------------------------------------------
create table if not exists public.characters (
  id          uuid        primary key default gen_random_uuid(),
  book_id     uuid        not null references public.books (id) on delete cascade,
  name        text        not null,
  description text,
  image_url   text,                       -- Supabase Storage public URL
  tags        text[]      default '{}',   -- multiple tags
  created_at  timestamptz default now()
);

-- locations -------------------------------------------------------------------
create table if not exists public.locations (
  id          uuid        primary key default gen_random_uuid(),
  book_id     uuid        not null references public.books (id) on delete cascade,
  name        text        not null,
  description text,
  image_url   text,
  tags        text[]      default '{}',
  created_at  timestamptz default now()
);

-- quotes ----------------------------------------------------------------------
-- Deleting a book deletes its quotes (CASCADE). Deleting a character KEEPS the
-- quote and only clears character_id (SET NULL).
create table if not exists public.quotes (
  id              uuid        primary key default gen_random_uuid(),
  book_id         uuid        not null references public.books (id) on delete cascade,
  character_id    uuid        references public.characters (id) on delete set null,
  content         text        not null,
  page_or_chapter text,
  created_at      timestamptz default now()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

create index if not exists books_user_id_idx        on public.books      (user_id);
create index if not exists characters_book_id_idx    on public.characters (book_id);
create index if not exists locations_book_id_idx     on public.locations  (book_id);
create index if not exists quotes_book_id_idx        on public.quotes     (book_id);
create index if not exists quotes_character_id_idx   on public.quotes     (character_id);

-- ============================================================================
-- 3. TRIGGER: create a profile for every new user
-- ============================================================================
-- Supabase does not create a public.profiles row when someone signs up;
-- without this trigger the first book insert fails on the user_id foreign key.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================
-- RLS is enabled on every table. profiles and books carry ownership directly;
-- characters, locations and quotes resolve it through their book.

alter table public.profiles   enable row level security;
alter table public.books      enable row level security;
alter table public.characters enable row level security;
alter table public.locations  enable row level security;
alter table public.quotes     enable row level security;

-- profiles --------------------------------------------------------------------
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- books -----------------------------------------------------------------------
drop policy if exists "own books" on public.books;
create policy "own books" on public.books for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- characters ------------------------------------------------------------------
-- No user_id column; ownership resolves through book_id -> books.user_id.
-- Both using and with check are needed for INSERT to work.
drop policy if exists "own characters" on public.characters;
create policy "own characters" on public.characters for all
  using (exists (
    select 1 from public.books
    where books.id = characters.book_id
      and books.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.books
    where books.id = characters.book_id
      and books.user_id = auth.uid()
  ));

-- locations -------------------------------------------------------------------
drop policy if exists "own locations" on public.locations;
create policy "own locations" on public.locations for all
  using (exists (
    select 1 from public.books
    where books.id = locations.book_id
      and books.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.books
    where books.id = locations.book_id
      and books.user_id = auth.uid()
  ));

-- quotes ----------------------------------------------------------------------
drop policy if exists "own quotes" on public.quotes;
create policy "own quotes" on public.quotes for all
  using (exists (
    select 1 from public.books
    where books.id = quotes.book_id
      and books.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.books
    where books.id = quotes.book_id
      and books.user_id = auth.uid()
  ));

-- ============================================================================
-- 5. STORAGE: bucket and policies
-- ============================================================================
-- Bucket: book-images (public read, authenticated write).
-- Path convention: {user_id}/{book_id}/{uuid}.png
-- Table RLS does not cover Storage; storage.objects needs its own policies.

insert into storage.buckets (id, name, public)
values ('book-images', 'book-images', true)
on conflict (id) do nothing;

-- Writing: a user may only upload into their own {user_id}/ folder.
drop policy if exists "own folder upload" on storage.objects;
create policy "own folder upload" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'book-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Updating and deleting: only objects inside their own folder.
drop policy if exists "own folder update" on storage.objects;
create policy "own folder update" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'book-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own folder delete" on storage.objects;
create policy "own folder delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'book-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reading: the bucket is public, so SELECT is open to everyone.
drop policy if exists "public read book-images" on storage.objects;
create policy "public read book-images" on storage.objects for select
  to public
  using (bucket_id = 'book-images');

-- ============================================================================
-- 6. SIGNING IN WITH A USERNAME
-- ============================================================================
-- Usernames are unique case-insensitively, which is what makes it possible to
-- resolve one to an account at sign-in. NULLs do not collide (older accounts
-- without a username sign in by email only).
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- Username -> account id (NOT the email address). Only service_role may
-- execute it: granted to anon or authenticated, anyone could call it through
-- PostgREST. service_role already bypasses RLS, so security definer is not
-- needed.
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
