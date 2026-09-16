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
  // Migration 002 öncesi veritabanlarında sütun yok; o durumda undefined gelir.
  cover_url?: string | null;
  // Migration 003: 1–5, yalnızca tamamlanan kitaplarda. finished_at 'YYYY-MM-DD'.
  rating?: number | null;
  finished_at?: string | null;
  created_at: string;
};

// "Bitirdim" butonunun göründüğü durumlar.
export const FINISHABLE_STATUSES: readonly BookStatus[] = ["reading", "paused"];

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export function isBookStatus(value: unknown): value is BookStatus {
  return (
    typeof value === "string" &&
    (BOOK_STATUSES as readonly string[]).includes(value)
  );
}
