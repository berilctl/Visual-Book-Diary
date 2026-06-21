import Link from "next/link";
import { updateBook } from "@/app/actions/books";
import { BOOK_STATUS_LABELS, type Book } from "@/lib/books";
import { BookFormDialog } from "./book-form-dialog";
import { DeleteBookButton } from "./delete-book-button";

function formatDate(value: string | null) {
  if (!value) return null;
  // 'YYYY-MM-DD' — yerel TZ kaymasını önlemek için gün başı olarak işle.
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
}

// Server Component. İçindeki düzenleme/silme aksiyonları client child'larda.
export function BookCard({ book }: { book: Book }) {
  const started = formatDate(book.start_date);

  return (
    <div className="flex flex-col rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-neutral-900">
      <Link href={`/books/${book.id}`} className="group block flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-tight group-hover:underline">
            {book.title}
          </h3>
          <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/70 dark:bg-white/10 dark:text-white/70">
            {BOOK_STATUS_LABELS[book.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          {book.author}
        </p>
        {started && (
          <p className="mt-2 text-xs text-black/45 dark:text-white/45">
            Başlangıç: {started}
          </p>
        )}
      </Link>

      <div className="mt-4 flex items-center gap-2 border-t border-black/5 pt-3 dark:border-white/5">
        <BookFormDialog
          action={updateBook}
          heading="Kitabı Düzenle"
          submitLabel="Kaydet"
          triggerLabel="Düzenle"
          triggerClassName="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
          bookId={book.id}
          initial={book}
        />
        <DeleteBookButton id={book.id} title={book.title} />
      </div>
    </div>
  );
}
