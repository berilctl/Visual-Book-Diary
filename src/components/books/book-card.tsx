import Link from "next/link";
import { updateBook } from "@/app/actions/books";
import type { Book } from "@/lib/books";
import { cardClass } from "@/components/ui/card";
import { BookCover } from "./book-cover";
import { BookFormDialog } from "./book-form-dialog";
import { DeleteBookButton } from "./delete-book-button";
import { StatusBadge } from "./status-badge";

// Kartta gösterilecek özet: kapak görselleri + içerik sayıları.
export type BookSummary = {
  images: string[];
  characters: number;
  locations: number;
  quotes: number;
};

const EMPTY_SUMMARY: BookSummary = {
  images: [],
  characters: 0,
  locations: 0,
  quotes: 0,
};

function formatDate(value: string | null) {
  if (!value) return null;
  // 'YYYY-MM-DD' — yerel TZ kaymasını önlemek için gün başı olarak işle.
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
}

// Server Component. İçindeki düzenleme/silme aksiyonları client child'larda.
export function BookCard({
  book,
  summary = EMPTY_SUMMARY,
}: {
  book: Book;
  summary?: BookSummary;
}) {
  const started = formatDate(book.start_date);

  const counts = [
    { n: summary.characters, label: "karakter" },
    { n: summary.locations, label: "mekan" },
    { n: summary.quotes, label: "alıntı" },
  ].filter((c) => c.n > 0);

  return (
    <article
      className={`group flex flex-col overflow-hidden transition hover:shadow-lift ${cardClass}`}
    >
      <Link href={`/books/${book.id}`} className="block" tabIndex={-1}>
        <BookCover bookId={book.id} images={summary.images} />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/books/${book.id}`} className="block flex-1">
          <h3 className="font-serif text-lg leading-snug text-ink group-hover:underline">
            {book.title}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">{book.author}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={book.status} />
            {started && (
              <span className="text-xs text-ink-subtle">{started}</span>
            )}
          </div>

          <p className="mt-3 text-xs text-ink-subtle">
            {counts.length > 0
              ? counts.map((c) => `${c.n} ${c.label}`).join(" · ")
              : "Henüz içerik yok"}
          </p>
        </Link>

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
          <BookFormDialog
            action={updateBook}
            heading="Kitabı Düzenle"
            submitLabel="Kaydet"
            triggerLabel="Düzenle"
            triggerVariant="secondary"
            bookId={book.id}
            initial={book}
          />
          <DeleteBookButton id={book.id} title={book.title} />
        </div>
      </div>
    </article>
  );
}
