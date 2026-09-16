// Görsel yükleme kuralları. Upload rotası (sunucu) ve formlardaki ön kontrol
// (istemci) aynı kaynaktan beslenir — server-only değil.
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
export const IMAGE_MAX_MB = 5;
export const IMAGE_MAX_BYTES = IMAGE_MAX_MB * 1024 * 1024;

export type ImageFileProblem = "type" | "empty" | "size";

// Sunucudaki kontrolün aynısı; yalnızca kullanıcıya erken geri bildirim için.
// Asıl yetki sunucuda (upload rotası) — bu fonksiyon güvenlik sınırı değil.
export function imageFileProblem(file: File): ImageFileProblem | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "type";
  if (file.size === 0) return "empty";
  if (file.size > IMAGE_MAX_BYTES) return "size";
  return null;
}
