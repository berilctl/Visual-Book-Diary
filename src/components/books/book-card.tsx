import Link from "next/link";
import { updateBook } from "@/app/actions/books";
import type { Book } from "@/lib/books";
import { cardClass } from "@/components/ui/card";
import { BookFormDialog } from "./book-form-dialog";
import { DeleteBookButton } from "./delete-book-button";
import { StatusBadge } from "./status-badge";

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
    <div
      className={`flex flex-col p-5 transition hover:shadow-lift ${cardClass}`}
    >
      <Link href={`/books/${book.id}`} className="group block flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg leading-snug text-ink group-hover:underline">
            {book.title}
          </h3>
          <span className="shrink-0">
            <StatusBadge status={book.status} />
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{book.author}</p>
        {started && (
          <p className="mt-2 text-xs text-ink-subtle">Başlangıç: {started}</p>
        )}
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
  );
}
