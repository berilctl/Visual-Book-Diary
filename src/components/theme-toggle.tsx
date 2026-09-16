"use client";

import { buttonClass } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { useI18n } from "@/components/i18n-provider";

// Tema anahtarı — bilerek React state'i yok.
// Hangi ikonun görüneceğine CSS karar veriyor: `dark:` variant'ı globals.css'te
// hem OS tercihini hem `data-theme`'i izleyecek şekilde tanımlı. Böylece
// hydration uyuşmazlığı ve efekt içinde setState (projede ESLint ile yasak)
// gerekmiyor; ilk boyama layout'taki senkron betikle zaten doğru.
export function ThemeToggle() {
  const { t } = useI18n();

  function toggle() {
    const root = document.documentElement;
    const isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;

    const next = isDark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Gizli sekme / kapalı depolama: seçim yalnızca bu sayfa için geçerli olur.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.common.themeToggle}
      title={t.common.themeToggle}
      className={buttonClass({ variant: "ghost", size: "icon" })}
    >
      <SunIcon className="hidden size-5 dark:block" />
      <MoonIcon className="size-5 dark:hidden" />
    </button>
  );
}
