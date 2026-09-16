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
