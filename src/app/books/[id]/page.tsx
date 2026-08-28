import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/books";
import type { Entity } from "@/lib/entities";
import type { Quote } from "@/lib/quotes";
import { BookTabs } from "@/components/books/book-tabs";
import { StatusBadge } from "@/components/books/status-badge";

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

  // Karakter, mekan ve alıntıları paralel çek (RLS yalnızca kullanıcının
  // verisini döner).
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

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-line px-4 py-4 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex min-h-8 items-center text-sm text-ink-muted transition hover:text-accent"
        >
          ← Kitaplığa dön
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl leading-tight text-ink">
              {book.title}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {book.author}
            </p>
          </div>
          <span className="shrink-0">
            <StatusBadge status={book.status} />
          </span>
        </div>
      </header>

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
