import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { BOOK_IMAGES_BUCKET } from "./url";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Artık hiçbir satırın göstermediği görselleri Storage'dan siler.
//
// - Kullanıcının oturumlu istemcisiyle çalışır: Storage'daki "own folder
//   delete" politikası yalnızca kendi klasöründeki dosyaların silinmesine izin
//   verir (yollar ayrıca ownImagePath ile doğrulanmış olarak gelir).
// - En iyi çaba: temizlik başarısız olursa kullanıcının asıl işlemi (kaydetme,
//   silme) bozulmaz; yalnızca sunucu loguna yazılır, dosya sahipsiz kalır.
// - Çağıranlar bunu veritabanı işlemi BAŞARILI olduktan sonra çağırır; aksi
//   hâlde satır silinmiş bir dosyayı gösterebilir.
export async function removeImages(
  supabase: Supabase,
  paths: (string | null | undefined)[],
): Promise<void> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (unique.length === 0) return;

  const { error } = await supabase.storage
    .from(BOOK_IMAGES_BUCKET)
    .remove(unique);
  if (error) {
    console.error("[storage-cleanup] remove failed:", error.message, unique);
  }
}

const PAGE_SIZE = 100;

// Kitap silindiğinde {userId}/{bookId}/ klasörünün tamamı (kapak + karakter ve
// mekan görselleri) sahipsiz kalır: veritabanı satırları CASCADE ile gider ama
// Storage dosyaları gitmez. Önce tüm sayfalar listelenir, sonra silinir
// (listelerken silmek offset'i kaydırıp dosya atlatırdı).
export async function removeBookFolder(
  supabase: Supabase,
  userId: string,
  bookId: string,
): Promise<void> {
  const folder = `${userId}/${bookId}`;
  const paths: string[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.storage
      .from(BOOK_IMAGES_BUCKET)
      .list(folder, { limit: PAGE_SIZE, offset });
    if (error) {
      console.error("[storage-cleanup] list failed:", error.message, folder);
      break;
    }
    // id'si null olanlar klasör kaydı; yalnızca dosyalar silinir.
    for (const item of data) {
      if (item.id) paths.push(`${folder}/${item.name}`);
    }
    if (data.length < PAGE_SIZE) break;
  }

  await removeImages(supabase, paths);
}
