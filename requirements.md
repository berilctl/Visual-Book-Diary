# Product Requirements Document (PRD)
## Project Name: Visual Book Diary (Dijital Görsel Kitap Günlüğü)

> **Versiyon:** 2.1 — Görsel girişi yalnızca dosya yükleme + AI üretimi olarak sadeleştirildi (harici URL desteği kaldırıldı).
> **Build aracı:** Claude Code ile sıfırdan geliştirilecek.

---

### 1. Project Overview (Proje Özeti)
Visual Book Diary, okurların okudukları kitaplardaki karakterleri, mekanları ve önemli alıntıları unutmamak için görsel ve metinsel notlar tutabileceği web tabanlı bir dijital günlüktür. Kullanıcılar kitap okuma süreçlerini takip edebilir, karakter ve mekan betimlemelerini Pinterest tarzı bir arayüzde görselleştirebilir ve yapay zeka entegrasyonu ile hayallerindeki tasvirleri görsele dönüştürebilirler.

Bu kişisel ölçekli bir projedir; düşük hacimli görsel üretimi ve tek kullanıcı odaklı veri izolasyonu varsayımları üzerine kuruludur.

---

### 2. Core Features (Temel Özellikler)
- **User Authentication (Kullanıcı Kimlik Doğrulama):** Supabase Auth ile güvenli giriş/çıkış. Her kullanıcı yalnızca kendi verisine erişir (RLS ile zorunlu kılınır).
- **Book Tracking (Kitap Takibi):** Kitap adı, yazar, okumaya başlama tarihi ve okuma durumu (`reading`, `completed`, `want_to_read`, `paused`, `dnf`) yönetimi. Durum değerleri veritabanında `CHECK` constraint ile kısıtlanır.
- **Visual Character & Location Directory (Görsel Karakter ve Mekan Dizini):**
  - Kitaplara bağlı karakter ve mekan kartları oluşturma.
  - Pinterest tarzı asimetrik yerleşim (**Masonry Layout** — pure CSS `columns`).
  - Görseller iki yolla eklenir: (a) kullanıcının **bilgisayarından dosya yükleme**, (b) **AI ile üretme**. Her iki durumda da görsel kalıcı olarak Supabase Storage'a kaydedilir. Harici/URL ile görsel ekleme **desteklenmez**.
- **AI Text-to-Image Integration (Yapay Zeka ile Görsel Üretimi):** Kullanıcının yazdığı karakter/mekan betimleme prompt'larına göre görsel üretme. Üretilen görsel **kalıcı olarak Supabase Storage'a kaydedilir** (sağlayıcının döndürdüğü geçici URL DB'ye yazılmaz — bkz. Bölüm 6).
- **Entity Tagging (Etiketleme Sistemi):** Karakterleri/mekanları gruplamak için çoklu etiket desteği (örn. bir karakter aynı anda "Vampir" + "Antagonist"). Postgres `text[]` array kolonu ile modellenir.
- **Quotes Section (Alıntı Köşesi):** Kitaplardan veya spesifik karakterlerden alıntılanan metinlerin, sayfa/bölüm numarasıyla kaydedilmesi. Bir alıntı isteğe bağlı olarak bir karaktere bağlanabilir.
- **Cascade Behavior:** Bir kitap silindiğinde ona ait tüm karakter, mekan ve alıntılar `ON DELETE CASCADE` ile temizlenir. Bir karakter silindiğinde, ona bağlı alıntılar silinmez; `character_id` `ON DELETE SET NULL` ile boşaltılır (alıntı korunur).

---

### 3. Tech Stack (Teknoloji Yığını)
- **Frontend:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS (Masonry için pure CSS `columns` mimarisi — harici kütüphane yok)
- **Backend as a Service (BaaS):** Supabase
  - **Database:** PostgreSQL (İlişkisel veritabanı, RLS aktif)
  - **Storage:** Supabase Object Storage (üretilen AI görsellerinin kalıcı barındırılması için)
  - **Auth:** Yerleşik Supabase Kimlik Doğrulama
- **AI Service (Görsel Üretimi):** Sağlayıcı-bağımsız tasarlanır. Tek bir `generateImage(prompt)` soyutlaması üzerinden çağrılır ki sağlayıcı değiştirmek tek dosya işi olsun.
  - **Birincil öneri:** **Replicate — Flux (Schnell)** — ucuz, hızlı (~3–8 sn) ve sanatsal/illüstratif çıktılar için bu use-case'e uygun.
  - **Alternatif:** **OpenAI — `gpt-image-1-mini`** (low/medium tier). *Not: DALL·E 3 OpenAI API'sinden kaldırıldı, kullanılamaz.*

---

### 4. Database Schema (Veritabanı Şeması)

> Tüm tablolar `public` şemasındadır. Her tabloda RLS **aktif** olmalıdır (bkz. Bölüm 5).

#### `profiles` (Kullanıcı Profilleri)
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid | Primary Key, `references auth.users(id) on delete cascade` |
| updated_at | timestamptz | |
| username | text | |

#### `books` (Kitaplar)
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid | PK, `default gen_random_uuid()` |
| user_id | uuid | NOT NULL, FK → `profiles(id)` `ON DELETE CASCADE` |
| title | text | NOT NULL |
| author | text | NOT NULL |
| start_date | date | |
| status | text | NOT NULL, `default 'reading'`, `CHECK (status in ('reading','completed','want_to_read','paused','dnf'))` |
| created_at | timestamptz | `default now()` |

İndeks: `user_id`.

#### `characters` (Karakterler)
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid | PK, `default gen_random_uuid()` |
| book_id | uuid | NOT NULL, FK → `books(id)` `ON DELETE CASCADE` |
| name | text | NOT NULL |
| description | text | |
| image_url | text | Supabase Storage public URL (dosya yükleme veya AI üretimi sonucu) |
| tags | text[] | `default '{}'` — çoklu etiket |
| created_at | timestamptz | `default now()` |

İndeks: `book_id`.

#### `locations` (Mekanlar)
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid | PK, `default gen_random_uuid()` |
| book_id | uuid | NOT NULL, FK → `books(id)` `ON DELETE CASCADE` |
| name | text | NOT NULL |
| description | text | |
| image_url | text | |
| tags | text[] | `default '{}'` (tutarlılık için karakterlerle aynı) |
| created_at | timestamptz | `default now()` |

İndeks: `book_id`.

#### `quotes` (Alıntılar)
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid | PK, `default gen_random_uuid()` |
| book_id | uuid | NOT NULL, FK → `books(id)` `ON DELETE CASCADE` |
| character_id | uuid | Nullable, FK → `characters(id)` `ON DELETE SET NULL` |
| content | text | NOT NULL |
| page_or_chapter | text | |
| created_at | timestamptz | `default now()` |

İndeks: `book_id`, `character_id`.

> **Tasarım notu:** `characters` ve `locations` benzer görünse de bilinçli olarak ayrı tutulmuştur. `quotes` doğrudan `characters`'a bağlanır ve karakterlere ileride role/ilk-görünme gibi alanlar eklenebilir. Tek `entities` tablosuna birleştirmeyin.

---

### 5. Database Setup: Triggers & RLS (Şart — Atlanamaz)

> Bunlar tek bir `schema.sql` / Supabase migration dosyasında toplanmalı ve setup'ta çalıştırılmalıdır.

#### 5.1 Profil otomatik oluşturma trigger'ı
Supabase'de kayıt olan kullanıcı için `profiles` satırı otomatik oluşmaz. Bu trigger olmadan ilk kitap eklemede `user_id` FK hatası alınır.

```sql
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

#### 5.2 RLS politikaları
Tüm tablolarda `enable row level security` açılır.

`books` doğrudan `user_id` taşıdığı için politikası basittir:
```sql
alter table books enable row level security;

create policy "own books" on books for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

`characters`, `locations`, `quotes` tablolarında `user_id` **yoktur**; sahiplik `books` üzerinden join ile doğrulanır. INSERT'in çalışması için hem `using` hem `with check` gereklidir:
```sql
alter table characters enable row level security;

create policy "own characters" on characters for all
using (exists (
  select 1 from books
  where books.id = characters.book_id and books.user_id = auth.uid()
))
with check (exists (
  select 1 from books
  where books.id = characters.book_id and books.user_id = auth.uid()
));
```
Aynı kalıp `locations` ve `quotes` için de uygulanır (tablo adını değiştirerek).

`profiles` için:
```sql
alter table profiles enable row level security;

create policy "own profile" on profiles for all
using (id = auth.uid())
with check (id = auth.uid());
```

#### 5.3 Storage bucket + RLS
- Bucket adı: `book-images` (public read, authenticated write).
- Dosya yolu konvansiyonu: `{user_id}/{book_id}/{uuid}.png`
- Tablo RLS'i Storage'ı korumaz; bucket için ayrı policy gerekir:
```sql
create policy "own folder upload" on storage.objects for insert
to authenticated
with check (
  bucket_id = 'book-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```
(Okuma public ise SELECT policy'si public; değilse yukarıdakine benzer `using` ile sınırlandırılır.)

---

### 6. Image Storage Pipeline (Görsel Kaydetme Akışı)

> Tüm görseller — ister kullanıcının yüklediği dosya, ister AI üretimi olsun — **aynı Storage upload pipeline'ından** geçer ve kalıcı Supabase Storage URL'i `image_url`'e yazılır. İki giriş noktası, tek hedef.

#### 6.1 Ortak yükleme yardımcı fonksiyonu
Hem dosya yükleme hem AI üretimi bu tek fonksiyonu kullanır:
```
// lib/storage/uploadImage.ts
// Görsel byte'larını Storage'a yazar, kalıcı public URL döner.
export async function uploadImage(bytes: Buffer, userId: string, bookId: string): Promise<string>
// Yol: `{userId}/{bookId}/{uuid}.png`
```

#### 6.2 Giriş 1 — Dosya yükleme (`/api/upload-image`, server-side)
1. Kullanıcıyı doğrula (`auth.getUser()`).
2. Hedef `book_id`'nin kullanıcıya ait olduğunu doğrula.
3. Yüklenen dosyayı al; tip (image/png, image/jpeg, image/webp) ve boyut (örn. ≤ 5 MB) validasyonu yap.
4. `uploadImage(bytes, userId, bookId)` → kalıcı public URL.
5. İlgili `characters` / `locations` satırını bu `image_url` ile insert/update et.

#### 6.3 Giriş 2 — AI üretimi (`/api/generate-image`, server-side)
> **Altın kural:** Sağlayıcının döndürdüğü görsel URL'i geçicidir (expire olur). Bu URL **asla** doğrudan DB'ye yazılmaz; görsel önce indirilip Storage'a yüklenir.

1. Kullanıcıyı doğrula; `book_id` sahipliğini ve prompt'u validate et.
2. `generateImage(prompt)` → görsel byte'ları (sağlayıcı-bağımsız soyutlama):
   ```
   // lib/ai/generateImage.ts — sağlayıcıyı değiştirmek burada başlar ve biter.
   export async function generateImage(prompt: string): Promise<Buffer>
   ```
3. `uploadImage(bytes, userId, bookId)` → kalıcı public URL (6.1 ile aynı fonksiyon).
4. İlgili satırı bu `image_url` ile insert/update et.

#### 6.4 Timeout & UX
- AI üretimi 5–15 sn sürebilir; indirme + upload eklenince serverless fonksiyon timeout limitine yaklaşır (örn. Vercel hobby planı 10 sn). Dosya yükleme tarafında bu risk daha düşüktür.
- Route'ta `export const maxDuration = ...` ile süreyi artır; gerekirse Replicate'in polling/webhook modelini kullan.
- Her iki akışta da net bir loading state ("Yükleniyor…" / "Görsel üretiliyor…") baştan planlanır.

---

### 7. Routing & UI Structure (Sayfa Yapısı)
- `/` : Landing Page & Login/Register (Giriş ve Karşılama Ekranı)
- `/dashboard` : Kullanıcının kitaplığının listelendiği ana panel (Kitap Ekleme Modalı buradadır).
- `/books/[id]` : Kitap Detay Sayfası. 3 adet Tab (Sekme):
  1. **Karakterler** — Masonry Grid + kart ekleme (dosya yükleme **veya** "AI ile Görsel Üret").
  2. **Mekanlar** — Masonry Grid + kart ekleme (dosya yükleme **veya** "AI ile Görsel Üret").
  3. **Alıntılar** — Liste görünümü + ekleme formu (opsiyonel karakter bağlama).

**Masonry notu:** Pure CSS `columns` pragmatik ve dependency'sizdir; ancak elemanları soldan sağa değil sütun sütun (yukarıdan aşağı) dizer. Kart sırası beklenenden farklı görünebilir — kişisel defter için kabul edilebilir, bilinçli tercih edilir.

---

### 8. Security & Best Practices (Güvenlik ve İyi Uygulamalar)
- **API anahtarları** (OpenAI/Replicate, Supabase service role) asla frontend'de ifşa edilmez. AI çağrıları yalnızca Next.js **Route Handler**'ları (server-side) üzerinden yapılır.
- **Environment variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client'ta kullanılabilir.
  - `SUPABASE_SERVICE_ROLE_KEY` — **yalnızca server-side**, asla client'a sızmaz.
  - `REPLICATE_API_TOKEN` **veya** `OPENAI_API_KEY` — yalnızca server-side.
- **Row Level Security (RLS)** tüm tablolarda aktif; her kullanıcı yalnızca kendi verisine erişir (Bölüm 5).
- **Görsel barındırma:** Tüm görseller Supabase Storage'da tutulur; harici/URL ile görsel ekleme yoktur, dolayısıyla Pinterest hotlink/URL kırılma riski tamamen ortadan kalkar. Next.js `<Image>` kullanılacaksa yalnızca Storage public domain'i (`*.supabase.co`) `next.config.js` içindeki `remotePatterns`'a eklenmelidir.
- **Dosya yükleme validasyonu:** Yüklenen dosyalarda tip (image/png, image/jpeg, image/webp) ve boyut (örn. ≤ 5 MB) kontrolü server-side yapılır.

---

### 9. Suggested Build Order (Claude Code için önerilen sıra)
1. **Proje iskeleti:** Next.js (App Router, TS) + Tailwind kurulumu, Supabase client (server + browser) kurulumu, env yapısı.
2. **DB temeli:** `schema.sql` — tablolar + index'ler + `handle_new_user` trigger'ı + tüm RLS politikaları + Storage bucket & policy. (Bölüm 4 & 5.)
3. **Auth:** Login/Register akışı, korumalı route'lar.
4. **Books CRUD:** `/dashboard` + kitap ekleme modalı + liste.
5. **Book detail + tabs:** `/books/[id]` üç sekme iskeleti.
6. **Ortak görsel yükleme:** Önce `lib/storage/uploadImage.ts` yardımcı fonksiyonu + `/api/upload-image` route'u kur (Bölüm 6.1–6.2). Dosya yükleme hem karakter/mekan kartlarında hem AI akışında paylaşılacağı için ilk bunu sağlamlaştır.
7. **Characters & Locations:** Masonry grid, kart ekleme (dosya yükleme ile), tags.
8. **AI image generation:** `generateImage()` soyutlaması + `/api/generate-image` route + adım 6'daki `uploadImage()`'i tekrar kullan + loading state (Bölüm 6.3).
9. **Quotes:** Liste + form + opsiyonel karakter bağlama.
10. **Polish:** Boş durumlar, hata yönetimi, responsive masonry.

> Her adımın sonunda commit at; AI üretimi (adım 8) en kırılgan kısım olduğu için ondan önce çekirdek CRUD'un ve ortak yükleme fonksiyonunun sağlam çalıştığından emin ol.
