"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
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

// The shared dialog shell.
// Accessibility lives here, in one place: role="dialog" plus aria-modal, the
// aria-labelledby link to the title, closing on Escape, a focus trap, moving
// focus inside on open, returning it to the trigger on close, and locking the
// background scroll.
export function Modal({
  open,
  onClose,
  heading,
  description,
  role = "dialog",
  children,
}: {
  open: boolean;
  onClose: () => void;
  heading: string;
  // When given, it is rendered under the title and linked with
  // aria-describedby, so screen readers announce the dialog with its description.
  description?: ReactNode;
  // "alertdialog": confirmations that the user has to answer.
  role?: "dialog" | "alertdialog";
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  // Callers pass onClose as an inline arrow function, so its identity changes
  // on every render. Keeping it in a ref lets the main effect depend on `open`
  // alone — otherwise focus would be pulled back inside on every render and the
  // user would lose the caret while typing.
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

  // Portal into document.body, so the dialog is rendered independently of the
  // component that opened it. When the library filter hides cards
  // (display:none), a dialog opened from inside one (the rating dialog after
  // finishing a book, say) stays visible, and the cards' hover and stacking
  // effects cannot reach it. The dialog only ever opens on the client through
  // user interaction, so document is never touched during server rendering.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-overlay"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto p-6 shadow-lift ${cardClass}`}
      >
        <h2 id={headingId} className="mb-5 font-serif text-xl text-ink">
          {heading}
        </h2>
        {description && (
          <div
            id={descriptionId}
            className="-mt-2 mb-6 text-sm leading-relaxed text-ink-muted"
          >
            {description}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

// The action row at the bottom of a dialog (cancel plus confirm).
export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex justify-end gap-2">{children}</div>;
}
