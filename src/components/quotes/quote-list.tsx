"use client";

import type { Entity } from "@/lib/entities";
import type { Quote } from "@/lib/quotes";
import { EmptyState } from "@/components/ui/empty-state";
import { QuoteIcon } from "@/components/ui/icons";
import { cardClass } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
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
  const { t } = useI18n();
  const nameById = new Map(characters.map((c) => [c.id, c.name]));
  const options = characters.map((c) => ({ id: c.id, name: c.name }));

  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={<QuoteIcon className="size-7" />}
        title={t.quotes.emptyTitle}
        hint={t.quotes.emptyHint}
        action={<QuoteFormDialog bookId={bookId} characters={options} />}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">{t.quotes.count(quotes.length)}</p>
        <QuoteFormDialog bookId={bookId} characters={options} />
      </div>

      <ul className="flex flex-col gap-3">
        {quotes.map((quote) => {
          const characterName = quote.character_id
            ? nameById.get(quote.character_id)
            : null;
          return (
            <li key={quote.id} className={`p-5 ${cardClass}`}>
              <div className="flex items-start justify-between gap-3">
                <blockquote className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-ink">
                  “{quote.content}”
                </blockquote>
                <DeleteQuoteButton id={quote.id} bookId={bookId} />
              </div>

              {(quote.page_or_chapter || characterName) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-subtle">
                  {characterName && (
                    <span className="font-medium text-ink-muted">
                      — {characterName}
                    </span>
                  )}
                  {quote.page_or_chapter && <span>{quote.page_or_chapter}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
