"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cardClass } from "@/components/ui/card";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableIn(root: HTMLElement | null) {
  if (!root) return [] as HTMLElement[];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

// Üç diyalogda birebir kopyalanan modal kabuğu.
// Erişilebilirlik buradan tek yerden geliyor: role="dialog" + aria-modal,
// başlığa aria-labelledby bağı, Escape ile kapatma, odak tuzağı, açılışta
// odağın içeri alınması, kapanışta tetikleyiciye geri verilmesi ve arka plan
// scroll kilidi.
export function Modal({
  open,
  onClose,
  heading,
  children,
}: {
  open: boolean;
  onClose: () => void;
  heading: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  // onClose çağıranlarda satır içi arrow fonksiyon; her render'da kimliği
  // değişiyor. Ref'te tutuluyor ki asıl efekt yalnızca `open` değişince
  // çalışsın — aksi halde her render'da odak yeniden içeri alınır ve
  // kullanıcı yazarken odağı kaybederdi.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    (focusableIn(panel)[0] ?? panel)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = focusableIn(panelRef.current);
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      const inside = panelRef.current?.contains(active ?? null) ?? false;

      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-overlay"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className={`relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto p-6 shadow-lift ${cardClass}`}
      >
        <h2 id={headingId} className="mb-5 font-serif text-xl text-ink">
          {heading}
        </h2>
        {children}
      </div>
    </div>
  );
}

// Diyalogların alt aksiyon satırı (İptal + onay) — o da her yerde aynıydı.
export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex justify-end gap-2">{children}</div>;
}
