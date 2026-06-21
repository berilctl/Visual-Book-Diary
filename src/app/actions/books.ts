"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isBookStatus, type BookStatus } from "@/lib/books";

export type BookFormState = { ok?: boolean; error?: string } | undefined;

// FormData'dan ortak alanları çıkar ve doğrula.
function parseBookFields(formData: FormData):
  | { ok: true; title: string; author: string; start_date: string | null; status: BookStatus }
  | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();

  if (!title || !author) {
    return { ok: false, error: "Kitap adı ve yazar zorunludur." };
  }

  const start_date = String(formData.get("start_date") ?? "").trim() || null;
  const rawStatus = formData.get("status");
  const status: BookStatus = isBookStatus(rawStatus) ? rawStatus : "reading";

  return { ok: true, title, author, start_date, status };
}

// Yeni kitap ekle. user_id ASLA client'tan alınmaz — server-side auth'tan gelir.
export async function createBook(
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı. Lütfen tekrar giriş yap." };

  const fields = parseBookFields(formData);
  if (!fields.ok) return { error: fields.error };

  const { error } = await supabase.from("books").insert({
    user_id: user.id,
    title: fields.title,
    author: fields.author,
    start_date: fields.start_date,
    status: fields.status,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

// Mevcut kitabı güncelle. RLS, kullanıcının yalnızca kendi kitabını
// güncelleyebilmesini garanti eder.
export async function updateBook(
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı. Lütfen tekrar giriş yap." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Kitap kimliği eksik." };

  const fields = parseBookFields(formData);
  if (!fields.ok) return { error: fields.error };

  const { error } = await supabase
    .from("books")
    .update({
      title: fields.title,
      author: fields.author,
      start_date: fields.start_date,
      status: fields.status,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/books/${id}`);
  return { ok: true };
}

// Kitabı sil. İlişkili karakter/mekan/alıntılar DB'de ON DELETE CASCADE ile
// otomatik temizlenir (PRD Bölüm 2). RLS sahipliği zorunlu kılar.
export async function deleteBook(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await supabase.from("books").delete().eq("id", id);

  revalidatePath("/dashboard");
}
