import type { Entity } from "@/lib/entities";
import type { Quote } from "@/lib/quotes";
import { QuoteFormDialog } from "./quote-form-dialog";
import { DeleteQuoteButton } from "./delete-quote-button";

// Alıntılar düz liste görünümünde (masonry değil — PRD Bölüm 7).
export function QuoteList({
  bookId,
  quotes,
  characters,
}: {
  bookId: string;
  quotes: Quote[];
  characters: Entity[];
}) {
  const nameById = new Map(characters.map((c) => [c.id, c.name]));
  const options = characters.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-black/55 dark:text-white/55">
          {quotes.length} alıntı
        </p>
        <QuoteFormDialog bookId={bookId} characters={options} />
      </div>

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-black/15 px-6 py-16 text-center dark:border-white/15">
          <p className="text-sm text-black/55 dark:text-white/55">
            Henüz alıntı yok.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {quotes.map((quote) => {
            const characterName = quote.character_id
              ? nameById.get(quote.character_id)
              : null;
            return (
              <li
                key={quote.id}
                className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <blockquote className="whitespace-pre-wrap text-sm leading-relaxed">
                    “{quote.content}”
                  </blockquote>
                  <DeleteQuoteButton id={quote.id} bookId={bookId} />
                </div>

                {(quote.page_or_chapter || characterName) && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/50 dark:text-white/50">
                    {characterName && (
                      <span className="font-medium text-black/65 dark:text-white/65">
                        — {characterName}
                      </span>
                    )}
                    {quote.page_or_chapter && (
                      <span>{quote.page_or_chapter}</span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
