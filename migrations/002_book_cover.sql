-- ============================================================================
-- 002 — Kitap kapağı
-- ============================================================================
-- Mevcut bir Supabase veritabanına uygulamak için: SQL Editor'e yapıştır ve
-- Run. Yeni kurulumlarda gerekmez; schema.sql'deki books tablosu bu sütunu
-- zaten içeriyor. Tekrar çalıştırmak güvenli (idempotent).
--
-- Yeni RLS politikası gerekmiyor: "own books" politikası tüm işlemleri
-- kapsıyor, kapak dosyaları da mevcut book-images bucket'ının
-- {userId}/{bookId}/ klasörüne yazılıyor.
-- ============================================================================

alter table public.books
  add column if not exists cover_url text;

-- PostgREST'in yeni sütunu hemen görmesi için şema önbelleğini tazele.
notify pgrst, 'reload schema';
