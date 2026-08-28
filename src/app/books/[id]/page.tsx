import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/books";
import type { Entity } from "@/lib/entities";
import type { Quote } from "@/lib/quotes";
import { BrandMark } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { BookTabs } from "@/components/books/book-tabs";
import { StatusBadge } from "@/components/books/status-badge";

function formatDate(value: string | null) {
  if (!value) return null;
  // 'YYYY-MM-DD' — yerel TZ kaymasını önlemek için gün başı olarak işle.
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
}

// /books/[id] — Kitap detay sayfası + 3 sekme (PRD Bölüm 7).
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

  const started = formatDate(book.start_date);

  return (
    <main className="flex flex-1 flex-col">
      {/* Dashboard ile aynı üst bar — uygulama içinde tutarlı çerçeve. */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <BrandMark iconClassName="size-9" textClassName="text-base" />
          <LogoutButton />
        </div>
      </header>

      {/* Kitap künyesi. İçerik bölümüyle aynı max-w-5xl kabında; daha önce
          sayfa kenarına yaslanıp alttaki içerikle hizasız duruyordu. */}
      <div className="border-b border-line">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex min-h-8 items-center text-sm text-ink-muted transition hover:text-accent"
          >
            ← Kitaplığa dön
          </Link>

          <h1 className="mt-4 text-4xl leading-tight text-ink">{book.title}</h1>
          <p className="mt-2 text-base text-ink-muted">{book.author}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge status={book.status} />
            {started && (
              <span className="text-sm text-ink-subtle">
                Başlangıç: {started}
              </span>
            )}
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
