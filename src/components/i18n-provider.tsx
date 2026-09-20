"use client";

import { createContext, useContext, type ReactNode } from "react";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";

type I18n = { locale: Locale; intlLocale: string; t: Dictionary };

const I18nContext = createContext<I18n | null>(null);

// Only the locale code comes from the server; the dictionary is picked on the
// client. The dictionary holds functions (plurals, strings with names), and
// functions cannot be passed from a Server to a Client Component as props.
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
