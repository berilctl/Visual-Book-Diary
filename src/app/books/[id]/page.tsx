import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BOOK_STATUS_LABELS, type Book } from "@/lib/books";
import { BookTabs } from "@/components/books/book-tabs";

// /books/[id] — Kitap detay sayfası + 3 sekme iskeleti (PRD Bölüm 7).
// Next 16: params bir Promise'tir, await edilmelidir.
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

  // RLS yalnızca kullanıcının kendi kitabını döndürür; başkasının ya da
  // olmayan kitapta 0 satır -> null -> 404.
  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle<Book>();

  if (!book) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-black/10 px-6 py-4 dark:border-white/10">
        <Link
          href="/dashboard"
          className="text-sm text-black/55 transition hover:text-black/80 dark:text-white/55 dark:hover:text-white/80"
        >
          ← Kitaplığa dön
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              {book.title}
            </h1>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              {book.author}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/70 dark:bg-white/10 dark:text-white/70">
            {BOOK_STATUS_LABELS[book.status]}
          </span>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <BookTabs />
      </section>
    </main>
  );
}
