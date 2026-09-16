// Kitap durumları — DB'deki CHECK constraint ile birebir aynı (PRD Bölüm 4).
export const BOOK_STATUSES = [
  "reading",
  "completed",
  "want_to_read",
  "paused",
  "dnf",
] as const;

export type BookStatus = (typeof BOOK_STATUSES)[number];

// Durum etiketleri sözlükte: t.bookStatus[status].

export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  start_date: string | null;
  status: BookStatus;
  created_at: string;
};

export function isBookStatus(value: unknown): value is BookStatus {
  return (
    typeof value === "string" &&
    (BOOK_STATUSES as readonly string[]).includes(value)
  );
}
