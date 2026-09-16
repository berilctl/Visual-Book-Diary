// Kitap görsellerinin Storage adresi kontrolü.

export const BOOK_IMAGES_BUCKET = "book-images";

// Bir public URL kullanıcının KENDİ klasörünü gösteriyorsa bucket içi yolunu
// döner ("{userId}/{bookId}/{uuid}.png"), göstermiyorsa null. bookId verilirse
// kapsam o kitabın klasörüne daralır.
//
// Hem kayıt doğrulamasında (başkasının görseli bağlanamasın) hem de
// temizlikte (yalnızca kendi dosyan silinsin) kullanılır. Kurallar:
// - Düz startsWith yetmez: ".../{userId}/{bookId}/../../{başkası}/x.png" ön eki
//   geçer ama tarayıcı ".." (ve "%2e%2e") parçalarını çözünce başka
//   kullanıcının dosyasını gösterir. URL önce normalleştirilir.
// - "%" içeren yollar reddedilir: URL ayrıştırıcısı "%2F"i ayırıcı saymaz, ama
//   yol çözülürse "a/../../{başkası}" hâline gelebilir. Uygulamanın ürettiği
//   dosya adları (uuid.uzantı) hiçbir zaman kodlanmış karakter içermez.
export function ownImagePath(
  value: string,
  userId: string,
  bookId?: string,
): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  let url: URL;
  let root: URL;
  try {
    url = new URL(value);
    root = new URL(`/storage/v1/object/public/${BOOK_IMAGES_BUCKET}/`, base);
  } catch {
    return null;
  }

  const scope = bookId ? `${userId}/${bookId}/` : `${userId}/`;
  const expected = root.pathname + scope;

  if (
    url.origin !== root.origin ||
    url.search !== "" ||
    url.hash !== "" ||
    url.pathname.includes("%") ||
    !url.pathname.startsWith(expected) ||
    url.pathname.length <= expected.length
  ) {
    return null;
  }

  return url.pathname.slice(root.pathname.length);
}

// Kapak/görsel URL'i kullanıcının bu kitaba ait klasöründen mi geliyor?
export function isOwnBookImageUrl(
  value: string,
  userId: string,
  bookId: string,
): boolean {
  return ownImagePath(value, userId, bookId) !== null;
}
