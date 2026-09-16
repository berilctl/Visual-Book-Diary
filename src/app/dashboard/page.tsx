import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { BookFormDialog } from "@/components/books/book-form-dialog";
import type { BookSummary } from "@/components/books/book-card";
import { Library } from "@/components/books/library";
import { EmptyState } from "@/components/ui/empty-state";
import { BookIcon } from "@/components/ui/icons";
import type { Book } from "@/lib/books";
import { getDictionary } from "@/lib/i18n/server";

// /dashboard — kullanıcının kitaplığı (PRD Bölüm 7). RLS sayesinde yalnızca
// kendi kitapları döner.
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const t = await getDictionary();
  const displayName = profile?.username ?? user.email ?? t.dashboard.fallbackName;

  // Kitaplar + kart sayıları. Alt tablolar kitap başına değil, tek seferde
  // çekilip JS'te gruplanır (N+1 yok); RLS zaten yalnızca kullanıcının
  // satırlarını döndürdüğü için filtreye gerek kalmıyor. Kartın görseli artık
  // kitabın kendi kapağı; karakter/mekan görsellerini çekmeye gerek yok.
  const [{ data: books }, { data: characters }, { data: locations }, { data: quotes }] =
    await Promise.all([
      supabase.from("books").select("*").order("created_at", { ascending: false }),
      supabase.from("characters").select("book_id"),
      supabase.from("locations").select("book_id"),
      supabase.from("quotes").select("book_id"),
    ]);

  const list = (books ?? []) as Book[];

  const summaries = new Map<string, BookSummary>();
  const summaryFor = (bookId: string) => {
    let entry = summaries.get(bookId);
    if (!entry) {
      entry = { characters: 0, locations: 0, quotes: 0 };
      summaries.set(bookId, entry);
    }
    return entry;
  };

  for (const row of (characters ?? []) as { book_id: string }[]) {
    summaryFor(row.book_id).characters += 1;
  }
  for (const row of (locations ?? []) as { book_id: string }[]) {
    summaryFor(row.book_id).locations += 1;
  }
  for (const row of (quotes ?? []) as { book_id: string }[]) {
    summaryFor(row.book_id).quotes += 1;
  }

  const addButton = (
    <BookFormDialog
      heading={t.book.addTitle}
      submitLabel={t.common.add}
      triggerLabel={t.book.addCta}
    />
  );

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />

      <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl text-ink">{t.dashboard.title}</h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              {t.dashboard.greeting(displayName, list.length)}
            </p>
          </div>
          {list.length > 0 && addButton}
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={<BookIcon className="size-7" strokeWidth={1.4} />}
            title={t.dashboard.emptyTitle}
            hint={t.dashboard.emptyHint}
            action={addButton}
          />
        ) : (
          // Map istemci bileşenine düz nesne olarak geçer.
          <Library books={list} summaries={Object.fromEntries(summaries)} />
        )}
      </section>
    </main>
  );
}
