"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isEntityKind } from "@/lib/entities";
import { getDictionary } from "@/lib/i18n/server";
import { removeImages } from "@/lib/storage/cleanup";
import { ownImagePath } from "@/lib/storage/url";

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
  const t = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.errors.sessionMissing };

  const kind = formData.get("kind");
  if (!isEntityKind(kind)) return { error: t.errors.invalidKind };

  const bookId = String(formData.get("book_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!bookId) return { error: t.errors.bookIdMissing };
  if (!name) return { error: t.entity.nameRequired };

  // book_id sahipliği. RLS de korur; burada net hata dönüyoruz.
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) {
    return { error: t.errors.bookNotFound };
  }

  const description = String(formData.get("description") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const imageUrl = String(formData.get("image_url") ?? "").trim() || null;

  // image_url yalnızca kullanıcının bu kitaba ait Storage klasöründen gelebilir
  // (PRD Bölüm 8 — harici/URL yok). Önceden yalnızca bucket ön eki kontrol
  // ediliyordu; başka kullanıcının görsel adresi de kabul ediliyordu.
  const imagePath = imageUrl ? ownImagePath(imageUrl, user.id, bookId) : null;
  if (imageUrl && !imagePath) {
    return { error: t.errors.invalidImageSource };
  }

  const { error } = await supabase.from(kind).insert({
    book_id: bookId,
    name,
    description,
    image_url: imageUrl,
    tags,
  });
  if (error) {
    // Yüklenen görsel hiçbir satıra bağlanamadı: sahipsiz kalmasın.
    await removeImages(supabase, [imagePath]);
    return { error: error.message };
  }

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
  const t = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.errors.sessionMissing };

  const kind = formData.get("kind");
  if (!isEntityKind(kind)) return { error: t.errors.invalidKind };

  const id = String(formData.get("id") ?? "").trim();
  const bookId = String(formData.get("book_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: t.errors.cardIdMissing };
  if (!bookId) return { error: t.errors.bookIdMissing };
  if (!name) return { error: t.entity.nameRequired };

  // book_id sahipliği. RLS de korur; burada net hata dönüyoruz.
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) {
    return { error: t.errors.bookNotFound };
  }

  const description = String(formData.get("description") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));

  const updates: Record<string, unknown> = { name, description, tags };

  // image_url yalnızca yeni görsel verildiyse güncellenir; verildiyse de
  // sadece kullanıcının bu kitaba ait klasöründen gelebilir (createEntity ile aynı).
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const imagePath = imageUrl ? ownImagePath(imageUrl, user.id, bookId) : null;
  let previousImage: string | null = null;
  if (imageUrl) {
    if (!imagePath) {
      return { error: t.errors.invalidImageSource };
    }
    updates.image_url = imageUrl;

    // Güncellemeden sonra silinecek eski görseli önce oku.
    const { data: current } = await supabase
      .from(kind)
      .select("image_url")
      .eq("id", id)
      .maybeSingle();
    previousImage = current?.image_url ?? null;
  }

  const { error } = await supabase.from(kind).update(updates).eq("id", id);
  if (error) {
    await removeImages(supabase, [imagePath]);
    return { error: error.message };
  }

  // Değiştirilen eski görsel artık kullanılmıyor. Kapsam kullanıcı klasörü:
  // satırın kitabı formdaki bookId'den bağımsız doğrulanmış olmayabilir.
  if (previousImage && previousImage !== imageUrl) {
    await removeImages(supabase, [ownImagePath(previousImage, user.id)]);
  }

  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

// Karakter/mekan kartı sil. RLS sahipliği zorunlu kılar; kartın görseli de
// Storage'dan silinir.
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

  // .select: gerçekten silinen satırın görselini döndürür (RLS başkasının
  // kartını 0 satırla reddeder; o durumda hiçbir dosyaya dokunulmaz).
  const { data: deleted, error } = await supabase
    .from(kind)
    .delete()
    .eq("id", id)
    .select("image_url");

  if (!error && deleted) {
    await removeImages(
      supabase,
      deleted.map((row) =>
        row.image_url ? ownImagePath(row.image_url, user.id) : null,
      ),
    );
  }

  if (bookId) revalidatePath(`/books/${bookId}`);
}
