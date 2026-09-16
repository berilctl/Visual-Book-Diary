"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

export type QuoteFormState = { ok?: boolean; error?: string } | undefined;

// Alıntı ekle. content zorunlu; character_id opsiyoneldir (null olabilir).
// character_id verilirse o karakterin BU kitaba ait olduğu doğrulanır —
// başka kitabın karakterine bağlanamaz. user_id server-side; RLS devrede.
export async function createQuote(
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const t = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.errors.sessionMissing };

  const bookId = String(formData.get("book_id") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!bookId) return { error: t.errors.bookIdMissing };
  if (!content) return { error: t.quotes.contentRequired };

  // book_id sahipliği. RLS de korur; burada net hata dönüyoruz.
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) {
    return { error: t.errors.bookNotFound };
  }

  const pageOrChapter =
    String(formData.get("page_or_chapter") ?? "").trim() || null;
  const characterId =
    String(formData.get("character_id") ?? "").trim() || null;

  // character_id verildiyse, karakterin bu kitaba ait olduğunu doğrula.
  if (characterId) {
    const { data: character } = await supabase
      .from("characters")
      .select("id")
      .eq("id", characterId)
      .eq("book_id", bookId)
      .maybeSingle();
    if (!character) {
      return { error: t.quotes.characterNotInBook };
    }
  }

  const { error } = await supabase.from("quotes").insert({
    book_id: bookId,
    character_id: characterId,
    content,
    page_or_chapter: pageOrChapter,
  });
  if (error) return { error: error.message };

  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

// Alıntı sil. RLS sahipliği zorunlu kılar.
export async function deleteQuote(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  const bookId = String(formData.get("book_id") ?? "").trim();
  if (!id) return;

  await supabase.from("quotes").delete().eq("id", id);

  if (bookId) revalidatePath(`/books/${bookId}`);
}
