-- ============================================================================
-- 003 — Puan ve bitiş tarihi
-- ============================================================================
-- Mevcut bir Supabase veritabanına uygulamak için: SQL Editor'e yapıştır ve
-- Run. Yeni kurulumlarda gerekmez; schema.sql'deki books tablosu bu sütunları
-- zaten içeriyor. Tekrar çalıştırmak güvenli (idempotent).
--
-- Yeni RLS politikası gerekmiyor: "own books" politikası tüm işlemleri kapsıyor.
-- ============================================================================

-- 1–5 yıldız. NULL = puan verilmedi. Aralık veritabanında da zorunlu.
alter table public.books
  add column if not exists rating smallint check (rating between 1 and 5);

-- "Bitirdim"e basılan gün (kullanıcının yerel tarihi). Okuma istatistiği bunu kullanır.
alter table public.books
  add column if not exists finished_at date;

-- PostgREST'in yeni sütunları hemen görmesi için şema önbelleğini tazele.
notify pgrst, 'reload schema';
