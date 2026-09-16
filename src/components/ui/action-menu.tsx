"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MoreIcon } from "@/components/ui/icons";

export type ActionMenuItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  tone?: "danger";
  onSelect: () => void;
};

// Tetikleyici görünümü seçenekle gelir, dışarıdan sınıf olarak değil: aynı
// özgüllükteki çakışan sınıflar (px-0/px-4, w-full/w-24) bu projede CSS
// sırasına göre yanlış tarafı kazandırmıştı.
const TRIGGER_VARIANTS = {
  // Kart başlığında, metnin yanında.
  ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
  // Kapak görselinin üstünde: her zeminde okunur olsun.
  floating:
    "bg-surface/85 text-ink shadow-paper backdrop-blur hover:bg-surface",
} as const;

// "⋯" işlem menüsü — WAI-ARIA menu button deseni.
// - Tetikleyici: aria-haspopup="menu", aria-expanded; Enter/Space/tık açar,
//   ↓ açıp ilk öğeye, ↑ açıp son öğeye odaklanır.
// - Menü içinde: ↑/↓ döngüsel, Home/End; Escape kapatır ve odağı tetikleyiciye
//   verir; Tab kapatır ve odak doğal akışında ilerler; dışarı tıklama kapatır.
// - Seçimde önce odak tetikleyiciye döner, SONRA işlem çalışır: işlem bir
//   pencere açarsa pencere "önceki odak" olarak tetikleyiciyi kaydeder ve
//   kapanınca odak kaybolmaz (menü öğesi o sırada DOM'dan kalkmış olur).
export function ActionMenu({
  label,
  items,
  variant = "ghost",
}: {
  label: string;
  items: ActionMenuItem[];
  variant?: keyof typeof TRIGGER_VARIANTS;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusOnOpen = useRef<"first" | "last">("first");

  useEffect(() => {
    if (!open) return;

    const index = focusOnOpen.current === "last" ? items.length - 1 : 0;
    itemRefs.current[index]?.focus();

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, items.length]);

  function openMenu(focus: "first" | "last") {
    focusOnOpen.current = focus;
    setOpen(true);
  }

  function closeMenu(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function select(item: ActionMenuItem) {
    closeMenu(true);
    item.onSelect();
  }

  // Enter/Space burada ele alınmaz: butonun kendi click olayı açar/kapatır
  // (keydown'da da açmak çift tetiklemeye yol açardı).
  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu("first");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu("last");
    }
  }

  function handleMenuKeyDown(event: React.KeyboardEvent) {
    const nodes = itemRefs.current.filter(
      (el): el is HTMLButtonElement => el !== null,
    );
    const current = nodes.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (i: number) => nodes[(i + nodes.length) % nodes.length]?.focus();

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(current + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(nodes.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu(true);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? closeMenu(false) : openMenu("first"))}
        onKeyDown={handleTriggerKeyDown}
        className={`inline-flex size-8 items-center justify-center rounded-full transition ${TRIGGER_VARIANTS[variant]}`}
      >
        <MoreIcon className="size-5" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full z-20 mt-1 min-w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lift"
        >
          {items.map((item, index) => (
            <button
              key={item.key}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => select(item)}
              className={`flex min-h-10 w-full items-center gap-2.5 whitespace-nowrap px-3 text-left text-sm transition hover:bg-surface-sunken focus-visible:bg-surface-sunken focus-visible:outline-none ${
                item.tone === "danger" ? "text-danger" : "text-ink"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
