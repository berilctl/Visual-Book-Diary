// Book statuses — kept in sync with the CHECK constraint on books.status.
export const BOOK_STATUSES = [
  "reading",
  "completed",
  "want_to_read",
  "paused",
  "dnf",
] as const;

export type BookStatus = (typeof BOOK_STATUSES)[number];

// Status labels live in the dictionary: t.bookStatus[status].

export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  start_date: string | null;
  status: BookStatus;
  // Missing on databases older than migration 002, hence optional.
  cover_url?: string | null;
  // Added in migration 003: rating is 1–5 and only set on finished books.
  rating?: number | null;
  finished_at?: string | null;
  created_at: string;
};

// Statuses from which a book can be marked as finished.
export const FINISHABLE_STATUSES: readonly BookStatus[] = ["reading", "paused"];

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export function isBookStatus(value: unknown): value is BookStatus {
  return (
    typeof value === "string" &&
    (BOOK_STATUSES as readonly string[]).includes(value)
  );
}
