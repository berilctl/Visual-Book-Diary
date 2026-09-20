import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/books";
import type { Entity } from "@/lib/entities";
import type { Quote } from "@/lib/quotes";
import { AppHeader } from "@/components/app-header";
import { BookCover } from "@/components/books/book-cover";
import { BookProgress } from "@/components/books/book-progress";
import { BookTabs } from "@/components/books/book-tabs";
import { StatusBadge } from "@/components/books/status-badge";
import { formatDate } from "@/lib/format";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

// Book detail page with the character, location and quote tabs.
// Next 16: params is a Promise and has to be awaited.
export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

// Row-level security only returns the user's own book; someone else's book or
// a missing id yields 0 rows -> null -> 404.
  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle<Book>();

  if (!book) notFound();

// Characters, locations and quotes in parallel (again scoped to the user by
// row-level security).
  const [{ data: characters }, { data: locations }, { data: quotes }] =
    await Promise.all([
      supabase
        .from("characters")
        .select("*")
        .eq("book_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("locations")
        .select("*")
        .eq("book_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("quotes")
        .select("*")
        .eq("book_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  const started = formatDate(book.start_date, INTL_LOCALE[locale]);

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />

      {/* Book header, in the same max-w-5xl container as the content below so
          the two line up. */}
      <div className="border-b border-line">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex min-h-8 items-center text-sm text-ink-muted transition hover:text-accent"
          >
            {t.book.backToLibrary}
          </Link>

          <div className="mt-5 flex items-start gap-5 sm:gap-8">
            <BookCover
              seed={book.id}
              title={book.title}
              author={book.author}
              coverUrl={book.cover_url}
              size="hero"
              className="w-24 shrink-0 rounded-lg shadow-lift sm:w-36"
            />

            <div className="min-w-0 pt-1">
              <h1 className="break-words text-3xl leading-tight text-ink sm:text-4xl">
                {book.title}
              </h1>
              <p className="mt-2 text-base text-ink-muted">{book.author}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={book.status} />
                {started && (
                  <span className="text-sm text-ink-subtle">
                    {t.book.startedOn(started)}
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-col items-start gap-2 empty:hidden">
                <BookProgress book={book} variant="hero" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <BookTabs
          bookId={book.id}
          characters={(characters ?? []) as Entity[]}
          locations={(locations ?? []) as Entity[]}
          quotes={(quotes ?? []) as Quote[]}
        />
      </section>
    </main>
  );
}
