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

// Filtre durumu URL'de: ?status=reading&q=dan — sayfa yenilenince ya da
// detaydan geri dönünce korunur. window.history.replaceState Next router'ıyla
// entegre (useSearchParams güncellenir) ve sunucuya istek atmaz; aramada her
// tuş vuruşunda sayfanın sunucuda yeniden çizilmesi istenmez.
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

// Kitaplık: durum filtresi + arama + kart ızgarası.
//
// Filtreye uymayan kartlar KALDIRILMAZ, gizlenir: "Okunuyor" filtresindeyken
// "Bitirdim"e basılınca kitap tamamlandıya geçer; kart kaldırılsaydı içindeki
// bileşenler (açılmak üzere olan puan penceresi) de yok olurdu. Pencereler
// document.body'ye portal ile çizildiği için gizli kartın içinden açılsa da
// görünür.
export function Library({
  books,
  summaries,
}: {
  books: Book[];
  summaries: Record<string, BookSummary>;
}) {
  const { t } = useI18n();
  const searchParams = useSearchParams();

  // Arama kutusu yerel durumdan sürülür: değeri URL'den okumak, hızlı yazarken
  // router güncellemesi eşzamansız olduğu için imleç kaymasına yol açabilirdi.
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

  // Yalnızca kitabı olan durumların sekmesi (beş durum + "Tümü" dar ekranda
  // kalabalık). URL'deki durumun kitabı kalmadıysa (ör. son okunan kitap
  // bitirildi) "Tümü"ne düşülür.
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
          // Dar ekranda yatay kaydırılır. Kaydırma çubuğu gizli: kenarda kesilen
          // son buton kaydırılabildiğini zaten gösteriyor.
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

      {/* Ekran okuyucuya sonuç sayısı; görsel olarak yalnızca filtre varken. */}
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
          // display:contents sarmalayıcı ızgarayı bozmaz; hidden görünmez yapar
          // ama bileşeni bağlı tutar (yukarıdaki açıklama).
          <div key={book.id} hidden={!isVisible(book)} className="contents">
            <BookCard book={book} summary={summaries[book.id]} />
          </div>
        ))}
      </div>
    </div>
  );
}
