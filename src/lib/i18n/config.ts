// Locale configuration, shared by client and server (not server-only).
export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "tr";
export const LOCALE_COOKIE = "locale";

// Region tag for the Intl APIs (date formatting, case conversion).
export const INTL_LOCALE: Record<Locale, string> = {
  tr: "tr-TR",
  en: "en-US",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

// Picks the first supported language from an Accept-Language header, honouring
// q-weights: "en-GB,en;q=0.9,tr;q=0.8" -> "en". Falls back to the default.
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const weight = q ? Number(q.trim().slice(2)) : 1;
      return {
        lang: tag.toLowerCase().split("-")[0],
        weight: Number.isNaN(weight) ? 0 : weight,
      };
    })
    .sort((a, b) => b.weight - a.weight);

  const match = ranked.find((r) => isLocale(r.lang));
  return match ? (match.lang as Locale) : DEFAULT_LOCALE;
}
