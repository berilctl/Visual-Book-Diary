"use client";

import type { BookStatus } from "@/lib/books";
import { useI18n } from "@/components/i18n-provider";
import { Badge, type BadgeTone } from "@/components/ui/badge";

// Durumlar artık renk taşıyor: okunan kitap markanın aksanıyla öne çıkar,
// biten yeşille, okunacak yaldızla, pasif durumlar nötr kalır.
const STATUS_TONES: Record<BookStatus, BadgeTone> = {
  reading: "accent",
  completed: "success",
  want_to_read: "gold",
  paused: "neutral",
  dnf: "neutral",
};

export function StatusBadge({ status }: { status: BookStatus }) {
  const { t } = useI18n();
  return <Badge tone={STATUS_TONES[status]}>{t.bookStatus[status]}</Badge>;
}
