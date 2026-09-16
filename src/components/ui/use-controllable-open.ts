"use client";

import { useState } from "react";

// Pencerelerin açık/kapalı durumu için ortak mantık.
// - open verilmezse bileşen kendi durumunu tutar (kendi tetikleyici butonuyla).
// - open verilirse durum dışarıdan yönetilir: ör. ⋯ menüsü pencereyi açar.
//   Menü seçimden sonra kapandığı için pencere menünün İÇİNDE yaşayamaz;
//   kart seviyesinde durur ve buradan kontrol edilir.
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
