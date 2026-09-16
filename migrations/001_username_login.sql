-- ============================================================================
-- 001 — Kullanıcı adıyla giriş
-- ============================================================================
-- Mevcut bir Supabase veritabanına uygulamak için: SQL Editor'e yapıştır.
-- Yeni kurulumlarda gerekmez; schema.sql'in 6. bölümü aynı içeriği taşır.
-- Tekrar çalıştırmak güvenlidir (idempotent).
--
-- ÖNCE KONTROL — bu sorgu satır döndürürse aynı kullanıcı adını (harf
-- büyüklüğü farkıyla) paylaşan hesaplar var demektir ve aşağıdaki index
-- oluşmaz. Önce o kayıtlardan birinin kullanıcı adını değiştir:
--
--   select lower(username) as username, count(*)
--   from public.profiles
--   where username is not null
--   group by lower(username)
--   having count(*) > 1;
-- ============================================================================

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

-- PostgREST'in yeni fonksiyonu hemen görmesi için şema önbelleğini tazele.
notify pgrst, 'reload schema';
