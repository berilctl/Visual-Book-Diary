import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadTestForm } from "./upload-test-form";

// GEÇİCİ test sayfası — /api/upload-image pipeline'ını (Adım 6) tek başına
// denemek için. Adım 7'de gerçek kart akışı gelince kaldırılabilir.
export default async function UploadTestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: books } = await supabase
    .from("books")
    .select("id, title")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-black/55 transition hover:text-black/80 dark:text-white/55 dark:hover:text-white/80"
      >
        ← Kitaplığa dön
      </Link>
      <h1 className="mt-3 text-xl font-semibold">Görsel Yükleme Testi</h1>
      <p className="mt-1 mb-6 text-sm text-black/55 dark:text-white/55">
        Geçici sayfa. Ortak yükleme pipeline akışını doğrulamak için.
      </p>
      <UploadTestForm books={books ?? []} />
    </main>
  );
}
