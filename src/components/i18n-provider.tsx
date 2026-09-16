"use client";

import { createContext, useContext, type ReactNode } from "react";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";

type I18n = { locale: Locale; intlLocale: string; t: Dictionary };

const I18nContext = createContext<I18n | null>(null);

// Sunucudan yalnızca dil kodu gelir; sözlük istemcide seçilir. Sözlükte
// fonksiyonlar var (çoğul, isimli metinler) ve fonksiyonlar Server ->
// Client prop olarak aktarılamaz.
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider
      value={{ locale, intlLocale: INTL_LOCALE[locale], t: dictionaries[locale] }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n, I18nProvider içinde kullanılmalı.");
  }
  return value;
}
