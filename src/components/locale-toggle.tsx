"use client";

import { setLocale } from "@/app/actions/locale";
import { useI18n } from "@/components/i18n-provider";
import { LOCALES } from "@/lib/i18n/config";

// TR | EN anahtarı. Her dil ayrı bir submit butonu; seçili olan aria-pressed.
// Butonların `lang` özelliği ekran okuyucunun dil adını doğru telaffuz
// etmesini sağlar ("English" Türkçe sesle okunmaz).
export function LocaleToggle() {
  const { locale, t } = useI18n();

  return (
    <form
      action={setLocale}
      role="group"
      aria-label={t.locale.label}
      className="flex h-10 items-center gap-0.5 rounded-lg bg-surface-sunken p-1"
    >
      {LOCALES.map((code) => {
        const selected = code === locale;
        return (
          <button
            key={code}
            type="submit"
            name="locale"
            value={code}
            lang={code}
            aria-pressed={selected}
            aria-label={t.locale.names[code]}
            title={t.locale.names[code]}
            className={`h-full rounded-md px-2 text-xs font-semibold uppercase tracking-wide transition ${
              selected
                ? "bg-surface text-ink shadow-paper"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {code}
          </button>
        );
      })}
    </form>
  );
}
