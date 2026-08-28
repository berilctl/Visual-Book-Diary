import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBook } from "@/app/actions/books";
import { LogoutButton } from "@/components/logout-button";
import { BookFormDialog } from "@/components/books/book-form-dialog";
import { BookCard } from "@/components/books/book-card";
import { EmptyState } from "@/components/ui/empty-state";
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
    />
  );

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
        <div>
          <span className="font-serif text-base text-ink">Visual Book Diary</span>
          <p className="text-xs text-ink-subtle">
            Hoş geldin {displayName} 👋
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl text-ink">Kitaplığım</h1>
          {list.length > 0 && addButton}
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="Henüz kitabın yok"
            hint="İlk kitabını ekleyerek karakterlerini, mekanlarını ve alıntılarını biriktirmeye başla."
            action={addButton}
          />
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
