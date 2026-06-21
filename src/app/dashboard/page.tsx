import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBook } from "@/app/actions/books";
import { LogoutButton } from "@/components/logout-button";
import { BookFormDialog } from "@/components/books/book-form-dialog";
import { BookCard } from "@/components/books/book-card";
import type { Book } from "@/lib/books";

// /dashboard — kullanıcının kitaplığı (PRD Bölüm 7). RLS sayesinde yalnızca
// kendi kitapları döner. Kitap CRUD burada; karakter/mekan/alıntı Adım 5+.
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

  const { data: books } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (books ?? []) as Book[];

  const addButton = (
    <BookFormDialog
      action={createBook}
      heading="Kitap Ekle"
      submitLabel="Ekle"
      triggerLabel="+ Kitap Ekle"
      triggerClassName="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
    />
  );

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
        <div>
          <span className="text-sm font-semibold">Visual Book Diary</span>
          <p className="text-xs text-black/55 dark:text-white/55">
            Hoş geldin {displayName} 👋
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">Kitaplığım</h1>
          {list.length > 0 && addButton}
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-black/15 px-6 py-20 text-center dark:border-white/15">
            <p className="text-base font-medium">Henüz kitabın yok</p>
            <p className="max-w-sm text-sm text-black/55 dark:text-white/55">
              İlk kitabını ekleyerek karakterlerini, mekanlarını ve alıntılarını
              biriktirmeye başla.
            </p>
            {addButton}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
