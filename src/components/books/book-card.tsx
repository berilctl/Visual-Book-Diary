"use client";

import Link from "next/link";
import { updateBook } from "@/app/actions/books";
import type { Book } from "@/lib/books";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/components/i18n-provider";
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

// Client Component: seçili dile göre tarih biçimi ve çoğul sayılar
// sözlükteki fonksiyonlarla üretiliyor (fonksiyonlar sunucudan prop olarak
// aktarılamaz).
export function BookCard({
  book,
  summary = EMPTY_SUMMARY,
}: {
  book: Book;
  summary?: BookSummary;
}) {
  const { t, intlLocale } = useI18n();
  const started = formatDate(book.start_date, intlLocale);

  const counts = [
    summary.characters > 0 && t.entityKinds.characters.count(summary.characters),
    summary.locations > 0 && t.entityKinds.locations.count(summary.locations),
    summary.quotes > 0 && t.quotes.count(summary.quotes),
  ].filter(Boolean);

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
            {counts.length > 0 ? counts.join(" · ") : t.book.noContent}
          </p>
        </Link>

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
          <BookFormDialog
            action={updateBook}
            heading={t.book.editTitle}
            submitLabel={t.common.save}
            triggerLabel={t.common.edit}
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
