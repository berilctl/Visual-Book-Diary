// Sahipsiz görsel temizliği — book-images bucket'ında HİÇBİR satırın
// göstermediği dosyaları bulur ve (istenirse) siler.
//
// Kullanım (proje klasöründe, terminalde):
//   npm run storage:orphans              -> yalnızca rapor, hiçbir şey silinmez
//   npm run storage:orphans -- --delete  -> raporlanan dosyaları SİLER (geri alınamaz)
//
// Uygulama artık dosyaları kendisi temizliyor (lib/storage/cleanup.ts); bu
// betik o değişiklikten ÖNCE birikmiş dosyalar ve nadir kalan durumlar
// (yükleme başarılı olup kayıt isteği hiç gönderilemediyse) için.
//
// Güvenlik kuralları:
// - Varsayılan kuru çalıştırma; silme yalnızca --delete ile.
// - Referanslar (books.cover_url, characters.image_url, locations.image_url)
//   eksiksiz okunamazsa DURUR: eksik bir referans listesi, kullanılan dosyaları
//   sahipsiz gösterirdi.
// - Tablolar id'ye göre sıralı sayfalanır: sırasız sayfalama satır atlatabilir.
// - Son 1 saatte yüklenen dosyalar atlanır: o an formda yüklenmiş ama henüz
//   kaydedilmemiş bir görsel silinmesin.
// - Klasör işaret dosyaları (".emptyFolderPlaceholder" vb.) atlanır.
// - Service role ile çalışır (RLS'i aşar): TÜM kullanıcıların dosyalarını
//   tarar. Yalnızca bu bucket'a ve yalnızca listelenen dosyalara dokunur.

import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";

export const BUCKET = "book-images";
export const MIN_AGE_MS = 60 * 60 * 1000;
const DB_PAGE = 1000;
const STORAGE_PAGE = 100;
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

const REFERENCES = [
  ["books", "cover_url"],
  ["characters", "image_url"],
  ["locations", "image_url"],
];

// Public URL -> bucket içi nesne yolu. Bu bucket'ı göstermiyorsa null.
export function toObjectPath(publicUrl) {
  let pathname;
  try {
    pathname = new URL(publicUrl).pathname;
  } catch {
    return null;
  }
  const at = pathname.indexOf(PUBLIC_MARKER);
  if (at === -1) return null;
  const raw = pathname.slice(at + PUBLIC_MARKER.length);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

// Dosyaları sınıflandırır. createdAt okunamayan dosya "yeni" sayılır (güvenli taraf).
export function classify(files, referenced, now = Date.now()) {
  const orphans = [];
  const recent = [];
  for (const file of files) {
    const name = file.path.split("/").pop() ?? "";
    if (name.startsWith(".")) continue;
    if (referenced.has(file.path)) continue;
    const age = now - Date.parse(file.createdAt);
    if (!(age >= MIN_AGE_MS)) recent.push(file);
    else orphans.push(file);
  }
  return { orphans, recent };
}

async function loadReferences(supabase) {
  const referenced = new Set();
  for (const [table, column] of REFERENCES) {
    for (let from = 0; ; from += DB_PAGE) {
      const { data, error } = await supabase
        .from(table)
        .select(`id, ${column}`)
        .not(column, "is", null)
        .order("id")
        .range(from, from + DB_PAGE - 1);
      if (error) {
        throw new Error(`${table}.${column} okunamadı: ${error.message}`);
      }
      for (const row of data) {
        const path = toObjectPath(row[column]);
        if (path) referenced.add(path);
      }
      if (data.length < DB_PAGE) break;
    }
  }
  return referenced;
}

async function listFiles(supabase, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += STORAGE_PAGE) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: STORAGE_PAGE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      throw new Error(`"${prefix || "/"}" listelenemedi: ${error.message}`);
    }
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        files.push(...(await listFiles(supabase, path)));
      } else {
        files.push({
          path,
          size: item.metadata?.size ?? 0,
          createdAt: item.created_at,
        });
      }
    }
    if (data.length < STORAGE_PAGE) break;
  }
  return files;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY yok. " +
        "Betiği `npm run storage:orphans` ile çalıştır (.env.local okunur).",
    );
  }
  const shouldDelete = process.argv.includes("--delete");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Önce referanslar, sonra dosyalar: arada yüklenip bağlanan bir dosya
  // 1 saatlik eşik sayesinde "yeni" sayılır ve atlanır.
  const referenced = await loadReferences(supabase);
  const files = await listFiles(supabase);
  const { orphans, recent } = classify(files, referenced);

  const total = orphans.reduce((sum, f) => sum + f.size, 0);
  console.log(`Bucket: ${BUCKET}`);
  console.log(
    `Bucket'taki dosya: ${files.length} · kayıtlarda geçen görsel: ${referenced.size}`,
  );
  console.log(`Son 1 saatte yüklendiği için atlanan: ${recent.length}`);
  console.log(`Sahipsiz: ${orphans.length} dosya (${kb(total)})`);
  for (const f of orphans) {
    console.log(`  - ${f.path}  (${kb(f.size)}, ${f.createdAt})`);
  }

  if (!shouldDelete) {
    console.log(
      orphans.length
        ? "\nKuru çalıştırma — hiçbir şey silinmedi. Silmek için:\n  npm run storage:orphans -- --delete"
        : "\nTemizlenecek dosya yok.",
    );
    return;
  }
  if (orphans.length === 0) {
    console.log("\nTemizlenecek dosya yok.");
    return;
  }

  let removed = 0;
  for (let i = 0; i < orphans.length; i += STORAGE_PAGE) {
    const chunk = orphans.slice(i, i + STORAGE_PAGE).map((f) => f.path);
    const { data, error } = await supabase.storage.from(BUCKET).remove(chunk);
    if (error) {
      console.error(`Silme hatası (${chunk.length} dosyalık grup): ${error.message}`);
      continue;
    }
    removed += data?.length ?? 0;
  }
  console.log(`\nSilindi: ${removed}/${orphans.length} dosya.`);
  if (removed !== orphans.length) process.exitCode = 1;
}

// Doğrudan çalıştırıldığında (import edildiğinde değil).
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(`\nDurduruldu, hiçbir dosya silinmedi: ${error.message}`);
    process.exitCode = 1;
  });
}
