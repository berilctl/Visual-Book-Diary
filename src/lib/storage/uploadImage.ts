import "server-only";
import { createClient } from "@/lib/supabase/server";
import { BOOK_IMAGES_BUCKET as BUCKET } from "./url";

// Tüm görsel yüklemeleri bu tek fonksiyondan geçer (PRD Bölüm 6.1).

// İçerik tipinden dosya uzantısı. Yüklenen dosya png/jpeg/webp olabileceğinden
// gerçek tipi koruyup doğru uzantıyı seçiyoruz.
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Görsel byte'larını Storage'a `{userId}/{bookId}/{uuid}.{ext}` yoluna yazar
 * ve kalıcı public URL döner.
 *
 * `userId` çağıran route'ta server-side `auth.getUser()`'dan gelmelidir —
 * asla client'tan alınmaz. Yükleme kullanıcının oturumlu (cookie) Supabase
 * istemcisiyle yapılır; böylece Storage RLS "own folder upload" politikası
 * yolun ilk segmentini auth.uid() ile doğrular (PRD Bölüm 5.3).
 */
export async function uploadImage(
  bytes: Buffer,
  userId: string,
  bookId: string,
  contentType = "image/png",
): Promise<string> {
  const ext = EXT_BY_TYPE[contentType] ?? "png";
  const path = `${userId}/${bookId}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });

  if (error) {
    throw new Error(`Görsel Storage'a yüklenemedi: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}
