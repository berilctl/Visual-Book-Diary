// 'YYYY-MM-DD' tarihini seçili dilde biçimlendirir. Kitap kartı ve detay
// sayfasında aynı fonksiyon ayrı ayrı kopyalanmıştı.
export function formatDate(value: string | null, intlLocale: string) {
  if (!value) return null;
  // Yerel saat dilimi kaymasını önlemek için gün başı olarak işle.
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium" }).format(
    date,
  );
}

// Kullanıcının YEREL günü, 'YYYY-MM-DD'. toISOString() UTC günü verir;
// Türkiye'de (UTC+3) gece yarısından sonraki 3 saat bir önceki güne düşerdi.
export function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
