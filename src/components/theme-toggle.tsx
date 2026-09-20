"use client";

import { buttonClass } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { useI18n } from "@/components/i18n-provider";

// Theme switch — deliberately without React state.
// CSS decides which icon is visible: the `dark:` variant in globals.css follows
// both the OS preference and `data-theme`. That avoids a hydration mismatch and
// setState inside an effect (banned by the project's ESLint config); the first
// paint is already correct thanks to the synchronous script in the layout.
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
      // Private tab or blocked storage: the choice then applies to this page only.
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
