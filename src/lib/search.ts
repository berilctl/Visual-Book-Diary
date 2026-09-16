// Arama için metni katlar: büyük/küçük harf, aksan ve Türkçe'ye özgü harf
// farklarını yok sayar. Kullanıcının içeriği arayüz dilinden bağımsız olarak
// çoğunlukla Türkçe, bu yüzden katlama dile göre değişmez.
//   "Kürk Mantolu" -> "kurk mantolu",  "IŞIK" -> "isik",  "İstanbul" -> "istanbul"
// Sıra önemli: ı/İ/I önce "i"ye çevrilir. Aksi hâlde toLowerCase() "I"yı
// "i"ye, "İ"yi "i̇"ye (i + birleşik nokta) çevirir ve eşleşme bozulurdu.
export function foldForSearch(text: string) {
  return text
    .replace(/[ıİI]/g, "i")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesSearch(query: string, ...fields: string[]) {
  const needle = foldForSearch(query);
  if (!needle) return true;
  return foldForSearch(fields.join(" ")).includes(needle);
}
