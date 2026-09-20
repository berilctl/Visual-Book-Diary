// Folds text for search: ignores case, accents and Turkish-specific letter
// pairs. Entries are mostly Turkish whatever the interface language is, so the
// folding does not depend on the active locale.
//   "Kürk Mantolu" -> "kurk mantolu",  "IŞIK" -> "isik",  "İstanbul" -> "istanbul"
// Order matters: ı/İ/I are mapped to "i" first, because toLowerCase() turns
// "İ" into "i" plus a combining dot, which would no longer match.
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
