"use client";

import Link from "next/link";
import type { Book } from "@/lib/books";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/components/i18n-provider";
import { cardClass } from "@/components/ui/card";
import { BookCover } from "./book-cover";
import { BookFormDialog } from "./book-form-dialog";
import { BookProgress } from "./book-progress";
import { DeleteBookButton } from "./delete-book-button";
import { StatusBadge } from "./status-badge";

// Kartta gösterilecek içerik sayıları.
export type BookSummary = {
  characters: number;
  locations: number;
  quotes: number;
};

const EMPTY_SUMMARY: BookSummary = { characters: 0, locations: 0, quotes: 0 };

// Dikey, kapak odaklı kart — kitaplık bir raf gibi görünsün.
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
      {/* Kapak linki klavye sırasından çıkarıldı: aynı hedefe giden başlık
          linki zaten var, kapak dekoratif (alt=""). */}
      <Link href={`/books/${book.id}`} tabIndex={-1} className="block">
        <BookCover
          seed={book.id}
          title={book.title}
          author={book.author}
          coverUrl={book.cover_url}
          className="transition duration-300 group-hover:brightness-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/books/${book.id}`} className="block flex-1">
          <h3 className="line-clamp-2 font-serif text-base leading-snug text-ink group-hover:underline">
            {book.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-sm text-ink-muted">
            {book.author}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge status={book.status} />
            {started && (
              <span className="text-xs text-ink-subtle">{started}</span>
            )}
          </div>

          <p className="mt-2 text-xs text-ink-subtle">
            {counts.length > 0 ? counts.join(" · ") : t.book.noContent}
          </p>
        </Link>

        {/* Linkin DIŞINDA: link içinde buton geçersiz HTML olurdu ve tıklama
            sayfaya giderdi. */}
        <div className="mt-3 flex flex-col gap-1.5 empty:hidden">
          <BookProgress book={book} variant="card" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <BookFormDialog
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
