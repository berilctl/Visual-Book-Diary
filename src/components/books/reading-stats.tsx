"use client";

import type { Book } from "@/lib/books";
import { useI18n } from "@/components/i18n-provider";
import { CheckIcon, StarIcon } from "@/components/ui/icons";

// Reading stats under the library title: books finished this year, their
// average rating, and a note about finished books with no finish date.
//
// "This year" follows the user's LOCAL calendar (hence a client component):
// the server runs in UTC and would show the previous year during the first
// hours of New Year's Day. Since the server's year and the browser's can only
// differ in those few hours, the hydration warning is silenced deliberately
// for the year-dependent strings.
export function ReadingStats({ books }: { books: Book[] }) {
  const { t, intlLocale } = useI18n();
  const year = new Date().getFullYear();

  const completed = books.filter((book) => book.status === "completed");
  const thisYear = completed.filter((book) =>
    book.finished_at?.startsWith(`${year}-`),
  );
  const ratings = thisYear
    .map((book) => book.rating)
    .filter((rating): rating is number => typeof rating === "number");
  const average =
    ratings.length > 0
      ? new Intl.NumberFormat(intlLocale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
      : null;
  // Finished books without a finish date cannot be counted. Rather than drop
  // them silently, the user is told they can add the date from the edit form.
  const missingDates = completed.filter((book) => !book.finished_at).length;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 text-ink">
          <CheckIcon className="size-4 text-success" strokeWidth={2} />
          <span suppressHydrationWarning>
            {t.stats.finishedThisYear(thisYear.length)}
          </span>
        </span>

        {average && (
          <>
            <span aria-hidden className="text-line-strong">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <StarIcon filled className="size-4 text-gold" />
              <span aria-hidden suppressHydrationWarning>
                {t.stats.averageRating(average)}
              </span>
              <span className="sr-only" suppressHydrationWarning>
                {t.stats.averageRatingLabel(average)}
              </span>
            </span>
          </>
        )}
      </div>

      {missingDates > 0 && (
        <p className="mt-1 text-xs text-ink-subtle">
          {t.stats.missingDates(missingDates)}
        </p>
      )}
    </div>
  );
}
