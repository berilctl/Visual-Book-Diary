"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { BOOK_STATUSES, isBookStatus, type Book, type BookStatus } from "@/lib/books";
import { matchesSearch } from "@/lib/search";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { controlClass } from "@/components/ui/field";
import { SearchIcon } from "@/components/ui/icons";
import { BookCard, type BookSummary } from "./book-card";

type Filter = BookStatus | "all";

// The filter state lives in the URL: ?status=reading&q=dan survives a refresh
// and coming back from a detail page. window.history.replaceState is
// integrated with the Next router (useSearchParams updates) and sends no
// request, which is what search needs — re-rendering the page on the server on
// every keystroke is not.
function writeParams(changes: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    query ? `${window.location.pathname}?${query}` : window.location.pathname,
  );
}

// The library: status filter, search and the card grid.
//
// Cards that do not match the filter are HIDDEN rather than removed: with the
// "Reading" filter active, finishing a book moves it to "completed", and
// removing the card would take the components inside it with it — including
// the rating dialog that is about to open. Dialogs are portalled into
// document.body, so they stay visible even when opened from a hidden card.
export function Library({
  books,
  summaries,
}: {
  books: Book[];
  summaries: Record<string, BookSummary>;
}) {
  const { t } = useI18n();
  const searchParams = useSearchParams();

  // The search box is driven by local state: reading its value from the URL
  // could move the caret while typing fast, because the router update is async.
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const counts = new Map<BookStatus, number>();
  const matchCounts = new Map<Filter, number>([["all", 0]]);
  for (const book of books) {
    counts.set(book.status, (counts.get(book.status) ?? 0) + 1);
    if (matchesSearch(query, book.title, book.author)) {
      matchCounts.set("all", (matchCounts.get("all") ?? 0) + 1);
      matchCounts.set(book.status, (matchCounts.get(book.status) ?? 0) + 1);
    }
  }

  // Only statuses that actually have books get a tab (five statuses plus
  // "All" is crowded on a narrow screen). If the status in the URL has no books
  // left — the last book being read was finished, say — it falls back to "All".
  const statusParam = searchParams.get("status");
  const filters: Filter[] = [
    "all",
    ...BOOK_STATUSES.filter((status) => (counts.get(status) ?? 0) > 0),
  ];
  const active: Filter =
    isBookStatus(statusParam) && filters.includes(statusParam)
      ? statusParam
      : "all";

  const isVisible = (book: Book) =>
    (active === "all" || book.status === active) &&
    matchesSearch(query, book.title, book.author);

  const visibleCount = books.filter(isVisible).length;
  const filtering = active !== "all" || query.trim() !== "";

  function selectFilter(filter: Filter) {
    writeParams({ status: filter === "all" ? null : filter });
  }

  function updateQuery(value: string) {
    setQuery(value);
    writeParams({ q: value.trim() ? value : null });
  }

  function clearFilters() {
    setQuery("");
    writeParams({ status: null, q: null });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label={t.library.filterLabel}
          // Scrolls horizontally on narrow screens. The scrollbar is hidden:
          // the last button being cut off already signals that there is more.
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {filters.map((filter) => {
            const selected = filter === active;
            const count = matchCounts.get(filter) ?? 0;
            return (
              <button
                key={filter}
                type="button"
                aria-pressed={selected}
                onClick={() => selectFilter(filter)}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition ${
                  selected
                    ? "border-accent bg-accent text-accent-contrast"
                    : "border-line text-ink-muted hover:bg-surface-sunken hover:text-ink"
                }`}
              >
                {filter === "all" ? t.library.all : t.bookStatus[filter]}
                <span
                  className={`text-xs tabular-nums ${selected ? "opacity-80" : "text-ink-subtle"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative block sm:w-64">
          <span className="sr-only">{t.library.searchLabel}</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={t.library.searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
            className={`${controlClass} pl-9`}
          />
        </label>
      </div>

      {/* The result count for screen readers; visible only while a filter is active. */}
      <p
        aria-live="polite"
        className={filtering ? "mb-4 text-sm text-ink-subtle" : "sr-only"}
      >
        {filtering ? t.library.showing(visibleCount, books.length) : ""}
      </p>

      {visibleCount === 0 && (
        <EmptyState
          icon={<SearchIcon className="size-7" />}
          title={t.library.noResultsTitle}
          hint={t.library.noResultsHint}
          action={
            <button
              type="button"
              onClick={clearFilters}
              className={buttonClass({ variant: "secondary" })}
            >
              {t.library.clearFilters}
            </button>
          }
        />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {books.map((book) => (
          // display:contents keeps the wrapper from breaking the grid, and
          // hidden makes it invisible while keeping the component mounted.
          <div key={book.id} hidden={!isVisible(book)} className="contents">
            <BookCard book={book} summary={summaries[book.id]} />
          </div>
        ))}
      </div>
    </div>
  );
}
