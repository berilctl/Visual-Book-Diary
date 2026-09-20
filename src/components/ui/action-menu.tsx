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

// The trigger's appearance comes from a variant rather than a class passed in:
// conflicting classes of equal specificity (px-0/px-4, w-full/w-24) are
// resolved by CSS source order, which is not what the caller expects.
const TRIGGER_VARIANTS = {
  // Next to the text in a card heading.
  ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
  // On top of a cover image, where it has to stay legible on any background.
  floating:
    "bg-surface/85 text-ink shadow-paper backdrop-blur hover:bg-surface",
} as const;

// The "⋯" action menu, following the WAI-ARIA menu button pattern.
// - Trigger: aria-haspopup="menu", aria-expanded; Enter/Space/click opens it,
//   ↓ opens and focuses the first item, ↑ opens and focuses the last.
// - Inside the menu: ↑/↓ wrap around, Home/End jump; Escape closes and returns
//   focus to the trigger; Tab closes and moves on naturally; an outside click closes.
// - On selection focus returns to the trigger BEFORE the action runs: if the
//   action opens a dialog, the dialog records the trigger as "previous focus"
//   and focus survives the dialog closing (the menu item is gone by then).
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

  // Enter/Space are not handled here: the button's own click event toggles the
  // menu, and opening on keydown as well would fire it twice.
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
