-- ============================================================================
-- Visual Book Diary — Database Schema
-- PRD Bölüm 4 (Schema) & Bölüm 5 (Triggers, RLS, Storage)
--
-- Bu dosya tek parçadır ve Supabase SQL Editor'e olduğu gibi yapıştırılıp
-- çalıştırılabilir. Idempotent olacak şekilde yazılmıştır (tekrar çalıştırmak
-- güvenlidir): tablolar `if not exists`, policy/trigger'lar önce `drop` edilir.
--
-- Çalıştırma sırası: extension -> tablolar -> index'ler -> trigger -> RLS
-- politikaları -> Storage bucket & policy.
-- ============================================================================

-- gen_random_uuid() için (Supabase'de genelde zaten yüklüdür).
create extension if not exists pgcrypto;

-- ============================================================================
-- 1. TABLOLAR (PRD Bölüm 4)
-- ============================================================================

-- profiles --------------------------------------------------------------------
-- auth.users ile 1-1. Satır, kayıt anında handle_new_user trigger'ı tarafından
-- otomatik oluşturulur (bkz. Bölüm 5.1).
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
  created_at  timestamptz default now()
);

-- characters ------------------------------------------------------------------
create table if not exists public.characters (
  id          uuid        primary key default gen_random_uuid(),
  book_id     uuid        not null references public.books (id) on delete cascade,
  name        text        not null,
  description text,
  image_url   text,                       -- Supabase Storage public URL
  tags        text[]      default '{}',   -- çoklu etiket
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
-- Bir kitap silinince alıntı da silinir (CASCADE). Bir karakter silinince
-- alıntı KORUNUR, character_id boşaltılır (SET NULL) — PRD Bölüm 2.
create table if not exists public.quotes (
  id              uuid        primary key default gen_random_uuid(),
  book_id         uuid        not null references public.books (id) on delete cascade,
  character_id    uuid        references public.characters (id) on delete set null,
  content         text        not null,
  page_or_chapter text,
  created_at      timestamptz default now()
);

-- ============================================================================
-- 2. INDEX'LER (PRD Bölüm 4)
-- ============================================================================

create index if not exists books_user_id_idx        on public.books      (user_id);
create index if not exists characters_book_id_idx    on public.characters (book_id);
create index if not exists locations_book_id_idx     on public.locations  (book_id);
create index if not exists quotes_book_id_idx        on public.quotes     (book_id);
create index if not exists quotes_character_id_idx   on public.quotes     (character_id);

-- ============================================================================
-- 3. TRIGGER: yeni kullanıcı için profil oluşturma (PRD Bölüm 5.1)
-- ============================================================================
-- Supabase'de auth.users'a kayıt olunca public.profiles satırı otomatik
-- oluşmaz; bu trigger olmadan ilk kitap eklemede user_id FK hatası alınır.

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
-- 4. ROW LEVEL SECURITY (PRD Bölüm 5.2)
-- ============================================================================
-- Tüm tablolarda RLS aktif. profiles ve books doğrudan sahiplik taşır;
-- characters/locations/quotes sahipliği books üzerinden join ile doğrulanır.

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
-- user_id yok; sahiplik book_id -> books.user_id join ile doğrulanır.
-- INSERT'in çalışması için hem using hem with check gerekir.
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
-- 5. STORAGE: bucket + policy (PRD Bölüm 5.3)
-- ============================================================================
-- Bucket: book-images (public read, authenticated write).
-- Yol konvansiyonu: {user_id}/{book_id}/{uuid}.png
-- Tablo RLS'i Storage'ı korumaz; storage.objects için ayrı policy gerekir.

insert into storage.buckets (id, name, public)
values ('book-images', 'book-images', true)
on conflict (id) do nothing;

-- Yazma: kullanıcı yalnızca kendi {user_id}/ klasörüne yükleyebilir.
drop policy if exists "own folder upload" on storage.objects;
create policy "own folder upload" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'book-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Güncelleme/silme: yalnızca kendi klasöründeki objeler üzerinde.
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

-- Okuma: bucket public olduğu için herkese açık SELECT (PRD Bölüm 5.3).
drop policy if exists "public read book-images" on storage.objects;
create policy "public read book-images" on storage.objects for select
  to public
  using (bucket_id = 'book-images');

-- ============================================================================
-- 6. KULLANICI ADIYLA GİRİŞ
-- ============================================================================
-- Kullanıcı adı büyük/küçük harf duyarsız benzersizdir; girişte kullanıcı
-- adından hesap bulunabilmesi için şart. NULL'lar çakışmaz (kullanıcı adı
-- olmayan eski hesaplar yalnızca e-postayla giriş yapar).
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- Kullanıcı adından hesap kimliği (e-posta DEĞİL). Yalnızca service_role
-- çalıştırabilir: anon/authenticated'a açık olsaydı PostgREST üzerinden
-- herkes çağırabilirdi. service_role RLS'i zaten aştığı için security
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
