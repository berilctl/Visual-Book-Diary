"use client";

import { useState } from "react";

// Shared open/closed state for dialogs.
// - Without `open` the component keeps its own state and renders its trigger.
// - With `open` the state is controlled from the outside, e.g. by the ⋯ menu.
//   Since the menu unmounts after a selection, the dialog cannot live INSIDE
//   it; it sits at card level and is controlled from there.
export function useControllableOpen(
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = open !== undefined;
  const value = controlled ? open : internalOpen;

  function setValue(next: boolean) {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return [value, setValue, controlled] as const;
}
