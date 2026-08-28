import { BOOK_STATUS_LABELS, type BookStatus } from "@/lib/books";
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
  return <Badge tone={STATUS_TONES[status]}>{BOOK_STATUS_LABELS[status]}</Badge>;
}
