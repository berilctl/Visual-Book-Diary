// Formats a 'YYYY-MM-DD' date in the active locale.
export function formatDate(value: string | null, intlLocale: string) {
  if (!value) return null;
  // Parse as local midnight so the date never shifts a day by timezone.
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium" }).format(
    date,
  );
}

// The user's LOCAL day as 'YYYY-MM-DD'. toISOString() would give the UTC day,
// which is still yesterday for the first hours after midnight in UTC+3.
export function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
