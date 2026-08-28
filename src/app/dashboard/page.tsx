import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBook } from "@/app/actions/books";
import { BrandMark } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { BookFormDialog } from "@/components/books/book-form-dialog";
import { BookCard, type BookSummary } from "@/components/books/book-card";
import { EmptyState } from "@/components/ui/empty-state";
import { BookIcon } from "@/components/ui/icons";
import type { Book } from "@/lib/books";

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

  const displayName = profile?.username ?? user.email ?? "okur";

  // Kitaplar + kart özetleri. Alt tablolar kitap başına değil, tek seferde
  // çekilip JS'te gruplanır (N+1 yok); RLS zaten yalnızca kullanıcının
  // satırlarını döndürdüğü için filtreye gerek kalmıyor.
  const [{ data: books }, { data: characters }, { data: locations }, { data: quotes }] =
    await Promise.all([
      supabase.from("books").select("*").order("created_at", { ascending: false }),
      supabase
        .from("characters")
        .select("book_id, image_url")
        .order("created_at", { ascending: false }),
      supabase
        .from("locations")
        .select("book_id, image_url")
        .order("created_at", { ascending: false }),
      supabase.from("quotes").select("book_id"),
    ]);

  const list = (books ?? []) as Book[];

  const summaries = new Map<string, BookSummary>();
  const summaryFor = (bookId: string) => {
    let entry = summaries.get(bookId);
    if (!entry) {
      entry = { images: [], characters: 0, locations: 0, quotes: 0 };
      summaries.set(bookId, entry);
    }
    return entry;
  };

  for (const row of (characters ?? []) as {
    book_id: string;
    image_url: string | null;
  }[]) {
    const entry = summaryFor(row.book_id);
    entry.characters += 1;
    if (row.image_url) entry.images.push(row.image_url);
  }
  for (const row of (locations ?? []) as {
    book_id: string;
    image_url: string | null;
  }[]) {
    const entry = summaryFor(row.book_id);
    entry.locations += 1;
    if (row.image_url) entry.images.push(row.image_url);
  }
  for (const row of (quotes ?? []) as { book_id: string }[]) {
    summaryFor(row.book_id).quotes += 1;
  }

  const addButton = (
    <BookFormDialog
      action={createBook}
      heading="Kitap Ekle"
      submitLabel="Ekle"
      triggerLabel="+ Kitap Ekle"
    />
  );

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <BrandMark iconClassName="size-9" textClassName="text-base" />
          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl text-ink">Kitaplığım</h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              Merhaba {displayName} — {list.length} kitap
            </p>
          </div>
          {list.length > 0 && addButton}
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={<BookIcon className="size-7" strokeWidth={1.4} />}
            title="Henüz kitabın yok"
            hint="İlk kitabını ekleyerek karakterlerini, mekanlarını ve alıntılarını biriktirmeye başla."
            action={addButton}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                summary={summaries.get(book.id)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
