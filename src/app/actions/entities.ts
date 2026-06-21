"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isEntityKind } from "@/lib/entities";

export type EntityFormState = { ok?: boolean; error?: string } | undefined;

// "Vampir, Antagonist" -> ["Vampir", "Antagonist"] (trim + boşları at + tekille).
function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

// Karakter/mekan kartı ekle. image_url, client'ta önce /api/upload-image'e
// yüklenen dosyanın kalıcı Storage URL'idir (Adım 6) — opsiyoneldir.
// user_id server-side; RLS book sahipliğini zorunlu kılar.
export async function createEntity(
  _prev: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı. Lütfen tekrar giriş yap." };

  const kind = formData.get("kind");
  if (!isEntityKind(kind)) return { error: "Geçersiz tür." };

  const bookId = String(formData.get("book_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!bookId) return { error: "Kitap kimliği eksik." };
  if (!name) return { error: "İsim zorunludur." };

  // book_id sahipliği. RLS de korur; burada net hata dönüyoruz.
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) {
    return { error: "Kitap bulunamadı veya bu kitaba erişimin yok." };
  }

  const description = String(formData.get("description") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const imageUrl = String(formData.get("image_url") ?? "").trim() || null;

  // image_url yalnızca kendi Storage bucket'ımızdan gelebilir (PRD Bölüm 8 —
  // harici/URL yok). Prefix env'den türetilir, hardcode edilmez.
  if (imageUrl) {
    const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/book-images/`;
    if (!imageUrl.startsWith(storagePrefix)) {
      return { error: "Geçersiz görsel kaynağı." };
    }
  }

  const { error } = await supabase.from(kind).insert({
    book_id: bookId,
    name,
    description,
    image_url: imageUrl,
    tags,
  });
  if (error) return { error: error.message };

  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

// Karakter/mekan kartını güncelle. createEntity ile aynı güvenlik kalıbı:
// kind allowlist guard, book_id sahipliği, image_url değişiyorsa Storage-prefix
// kontrolü, RLS devrede. image_url yalnızca yeni bir görsel verildiğinde
// güncellenir; boşsa mevcut görsel korunur.
export async function updateEntity(
  _prev: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı. Lütfen tekrar giriş yap." };

  const kind = formData.get("kind");
  if (!isEntityKind(kind)) return { error: "Geçersiz tür." };

  const id = String(formData.get("id") ?? "").trim();
  const bookId = String(formData.get("book_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "Kart kimliği eksik." };
  if (!bookId) return { error: "Kitap kimliği eksik." };
  if (!name) return { error: "İsim zorunludur." };

  // book_id sahipliği. RLS de korur; burada net hata dönüyoruz.
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) {
    return { error: "Kitap bulunamadı veya bu kitaba erişimin yok." };
  }

  const description = String(formData.get("description") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));

  const updates: Record<string, unknown> = { name, description, tags };

  // image_url yalnızca yeni görsel verildiyse güncellenir; verildiyse de
  // sadece kendi Storage bucket'ımızdan gelebilir (createEntity ile aynı).
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  if (imageUrl) {
    const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/book-images/`;
    if (!imageUrl.startsWith(storagePrefix)) {
      return { error: "Geçersiz görsel kaynağı." };
    }
    updates.image_url = imageUrl;
  }

  const { error } = await supabase.from(kind).update(updates).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

// Karakter/mekan kartı sil. RLS sahipliği zorunlu kılar.
export async function deleteEntity(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const kind = formData.get("kind");
  if (!isEntityKind(kind)) return;

  const id = String(formData.get("id") ?? "").trim();
  const bookId = String(formData.get("book_id") ?? "").trim();
  if (!id) return;

  await supabase.from(kind).delete().eq("id", id);

  if (bookId) revalidatePath(`/books/${bookId}`);
}
