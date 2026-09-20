import { BrandMark } from "@/components/brand";
import { LocaleToggle } from "@/components/locale-toggle";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

// Shared header for the dashboard and the book detail page.
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Only the mark on narrow screens, leaving room for the language, theme and sign-out buttons. */}
        <BrandMark
          iconClassName="size-9"
          textClassName="hidden text-base sm:inline"
        />
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
