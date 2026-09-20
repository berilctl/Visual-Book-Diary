# Visual Book Diary

Bir kitaptan geriye kalanlar için kişisel bir okuma günlüğü: **karakterleri**, **mekanları** ve **saklamaya değer satırları**.

Çoğu okuma uygulaması "bitti / bitmedi" ile yetinir. Bu günlük, gerçekten aklında kalanla ilgileniyor: gözünde canlandırdığın bir yüz, içinde dolaştığın bir şehir, altını çizdiğin bir cümle. Kitaplar kapaklarıyla bir rafta durur; her biri kendi görsel dizinine açılır.

**English:** [README.md](README.md)

![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-087EA4?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_·_Auth_·_Storage-3ECF8E?logo=supabase&logoColor=white)

---

## Özellikler

**Kitaplık** — Kitaplar kapak kartları olarak listelenir (kapak yoksa tipografik bir kapak üretilir), duruma göre filtrelenir ve Türkçe karakterleri de doğru eşleyen, aksan/büyük-küçük harf duyarsız aramayla taranır. Filtre durumu URL'de tutulur; filtrelenmiş görünüm paylaşılabilir ve sayfa yenilense de kaybolmaz.

**Karakterler ve mekanlar** — Her kitapta görsel, açıklama ve çoklu etiket taşıyan kartlar, Pinterest tarzı masonry yerleşimde. Yerleşim saf CSS `columns` ile — masonry kütüphanesi yok.

**Alıntılar** — Sayfa veya bölüm bilgisiyle, istenirse bir karaktere bağlı olarak kaydedilir. Karakter silinince alıntı silinmez; yalnızca bağ kopar.

**Kitabı bitirmek** — "Bitirdim" kitabı tamamlandı yapar, yerel tarihi kaydeder, konfeti atar ve 5 yıldızlı puan penceresini açar (atlanabilir). Kitaplığın üstünde bu yıl bitirdiğin kitap sayısı ve ortalama puanın görünür.

**İki dilli arayüz** — Türkçe ve İngilizce, üst bardaki düğmeyle değişir, çerezde saklanır, ilk ziyarette `Accept-Language`'ten tahmin edilir. Kullanıcıya görünen her metin tipli bir sözlükte durur: eksik bir anahtar boş bir etiket değil, derleme hatası verir.

**Açık ve koyu tema** — Elle seçilir ya da işletim sisteminden gelir; senkron bir betikle ilk karede uygulanır, yanlış temanın parlaması yaşanmaz.

**Hesaplar** — E-posta ya da kullanıcı adıyla giriş.

---

## Teknoloji yığını

| Katman | Seçim |
|---|---|
| Çatı | Next.js 16 (App Router, Server Actions, Turbopack) · React 19 |
| Dil | TypeScript (strict) |
| Stil | Tailwind CSS v4, tema token'ları `globals.css` içinde |
| Veritabanı | Supabase Postgres, row-level security açık |
| Kimlik doğrulama | Supabase Auth (e-posta/kullanıcı adı + şifre) |
| Dosyalar | Supabase Storage |
| Diğer | `canvas-confetti`, yalnızca gerektiğinde dinamik yüklenir |

Çatı ve Supabase dışındaki tek çalışma zamanı bağımlılığı `canvas-confetti`. Arayüz kiti, durum kütüphanesi, masonry kütüphanesi, tarih kütüphanesi yok.

---

## Kurulum

**Gereken:** Node.js 20+ ve ücretsiz bir [Supabase](https://supabase.com) projesi.

```bash
git clone <depo-adresi>
cd visual_book_diary
npm install
```

**1. Ortam değişkenleri** — şablonu kopyala ve Supabase projendeki değerlerle doldur (Settings → API):

```bash
cp .env.example .env.local
```

| Değişken | Nerede çalışır |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | tarayıcı + sunucu |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tarayıcı + sunucu |
| `SUPABASE_SERVICE_ROLE_KEY` | **yalnızca sunucu** — RLS'i bypass eder, asla dışarı verme |

**2. Veritabanı** — Supabase SQL Editor'ü aç, [`schema.sql`](schema.sql) dosyasının tamamını yapıştır ve çalıştır. Tabloları, index'leri, yeni kullanıcı trigger'ını, tüm RLS politikalarını, Storage bucket'ını ve politikalarını, kullanıcı adı arama fonksiyonunu kurar.

**3. Çalıştır:**

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde.

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi ve sunucusu |
| `npm run lint` | ESLint |
| `npm run storage:orphans` | Storage'da veritabanı kaydı kalmamış dosyaları raporlar |
| `npm run storage:orphans -- --delete` | Bu dosyaları siler (geri alınamaz) |

Vercel'e olduğu gibi kurulur: depoyu içe aktar, üç ortam değişkenini gir, tamam.

---

## Veri modeli

```
profiles ──< books ──< characters ──< quotes
                   ├──< locations
                   └──< quotes
```

Kitap bir kullanıcıya; karakter, mekan ve alıntılar bir kitaba aittir. Kitap silinince hepsi birlikte silinir. Karakter silinince `quotes.character_id` `NULL` olur, alıntı korunur.

Görseller `book-images/{userId}/{bookId}/{uuid}.{uzantı}` yolunda saklanır — sahipliğin yalnızca URL'e bakarak doğrulanabilmesini sağlayan bir düzen.

[`schema.sql`](schema.sql) sıfırdan bir veritabanını tek seferde kurar. [`migrations/`](migrations/) ise mevcut bir veritabanına sırayla uygulanan, her biri idempotent değişiklikleri tutar.

---

## Güvenlik

Uygulama küçük ama çok kullanıcılı; bu yüzden sahiplik tek bir yerde değil, birkaç katmanda zorlanıyor:

- **Her tabloda row-level security.** Sahiplik `books.user_id` üzerinden çözülür; alt tablolar bunu bir `exists` alt sorgusuyla kontrol eder. Storage'ın kendi politikaları var — tablo RLS'i Storage'ı kapsamaz — ve yazma yalnızca kullanıcının kendi klasörüne açık.
- **Service-role anahtarı tarayıcıya hiç ulaşmaz.** Tek bir `server-only` modülde durur ve yalnızca iki iş için kullanılır: girişte kullanıcı adını hesaba çevirmek ve sahipsiz dosya temizliği betiği.
- **Kullanıcı adı araması `security definer` bir SQL fonksiyonu**, `search_path = ''` ile; `EXECUTE` yetkisi sadece `service_role`'de. Başarısız girişler tek bir genel mesaj döner, böylece form hesap keşfi için kullanılamaz.
- **Görsel URL'lerine güvenilmez, doğrulanır.** URL bir kayda girmeden önce ayrıştırılıp normalleştirilir; `%` içeren yollar reddedilir — aksi hâlde `../`, `%2e%2e` ve `%2F` kaçışları kullanıcının klasörünün dışına çıkabilir. Aynı kontrol silmede de geçerli olduğu için temizlik yalnızca kendi dosyalarına dokunabilir.
- **Yüklemeler sunucuda denetlenir:** oturum, kitap sahipliği, MIME tipi ve boyut (5 MB). İstemcideki kontrol yalnızca erken geri bildirim içindir.
- **Storage hataları loglanır, döndürülmez.** Bucket yolları ve politika mesajları sunucuda kalır.

**Bilinen sınır:** görsel bucket'ı herkese açık okunabilir; yani URL'i elinde olan görseli açabilir. URL'ler rastgele bir UUID içerir ve hiçbir yerde listelenmez, ama bu erişim denetimi değil, belirsizlik. Proje kişisel kullanımın ötesine geçerse bir sonraki adım özel bucket ve imzalı URL'ler olurdu.

---

## Proje yapısı

```
src/
├── app/                    route'lar (App Router)
│   ├── page.tsx            landing + giriş / kayıt
│   ├── dashboard/          kitaplık
│   ├── books/[id]/         kitap detayı
│   ├── actions/            server action'lar (auth, books, entities, quotes, locale)
│   └── api/upload-image/   tek görsel yükleme uç noktası
├── components/
│   ├── ui/                 temel parçalar: buton, pencere, menü, yıldız puanı, …
│   ├── books/ entities/ quotes/
│   └── app-header, theme-toggle, locale-toggle, …
├── lib/
│   ├── supabase/           tarayıcı, sunucu, admin istemcileri
│   ├── storage/            yükleme, URL doğrulama, temizlik, limitler
│   ├── i18n/               sözlükler ve dil çözümü
│   └── books.ts, search.ts, format.ts, …
└── proxy.ts                oturum tazeleme + route koruması
```

`proxy.ts`, Next 16'da `middleware.ts`'in yerini alan dosya.

Tasarım token'ları `src/app/globals.css` içinde; bileşenler ham renk yerine token utility'lerini (`bg-paper`, `text-ink`, `border-line`, …) kullanır. Üç tema durumunu — açık, işletim sistemi koyu ve elle seçilmiş koyu — tutarlı tutan da bu.

Erişilebilirlik sona bırakılmış bir kontrol değil, işin parçası: pencerelerde odak tuzağı ve odağın geri dönmesi, yıkıcı onaylar için `alertdialog`, sekmelerde ve yıldızlarda roving tabindex, WAI-ARIA menü düğmesi, her yerde görünür odak halkası ve `prefers-reduced-motion`'a uyan konfeti.

---

## Hakkında

Uçtan uca yapılmış kişisel bir proje: ürün gereksinimleri ([`requirements.md`](requirements.md)), şema, tasarım sistemi ve uygulama.
