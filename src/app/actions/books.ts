"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isBookStatus, type BookStatus } from "@/lib/books";
import { getDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { removeBookFolder, removeImages } from "@/lib/storage/cleanup";
import { isOwnBookImageUrl, ownImagePath } from "@/lib/storage/url";

// id: createBook başarılı olunca yeni kitabın kimliği (kapak yüklemesi için).
export type BookFormState =
  | { ok?: boolean; error?: string; id?: string }
  | undefined;

// FormData'dan ortak alanları çıkar ve doğrula.
function parseBookFields(
  formData: FormData,
  t: Dictionary,
):
  | { ok: true; title: string; author: string; start_date: string | null; status: BookStatus }
  | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();

  if (!title || !author) {
    return { ok: false, error: t.book.titleAuthorRequired };
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
  const t = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.errors.sessionMissing };

  const fields = parseBookFields(formData, t);
  if (!fields.ok) return { error: fields.error };

  // Kapak ayrı adımda eklenir: yükleme hattı görseli var olan bir kitabın
  // klasörüne yazar, bu yüzden istemci önce kimliği alır.
  const { data, error } = await supabase
    .from("books")
    .insert({
      user_id: user.id,
      title: fields.title,
      author: fields.author,
      start_date: fields.start_date,
      status: fields.status,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

// Mevcut kitabı güncelle. RLS, kullanıcının yalnızca kendi kitabını
// güncelleyebilmesini garanti eder.
//
// Kapak (opsiyonel): "cover_url" verilirse yalnızca kullanıcının bu kitaba ait
// Storage klasöründen gelebilir; "remove_cover=1" kapağı kaldırır. İkisi de
// yoksa mevcut kapağa dokunulmaz.
//
// Storage temizliği: kayıt başarılıysa artık kullanılmayan eski kapak dosyası,
// başarısızsa yeni yüklenen (hiçbir satıra bağlanamayan) dosya silinir.
export async function updateBook(
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const t = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.errors.sessionMissing };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: t.errors.bookIdMissing };

  const fields = parseBookFields(formData, t);
  if (!fields.ok) return { error: fields.error };

  const updates: Record<string, unknown> = {
    title: fields.title,
    author: fields.author,
    start_date: fields.start_date,
    status: fields.status,
  };

  const coverUrl = String(formData.get("cover_url") ?? "").trim();
  const removeCover = formData.get("remove_cover") === "1";
  if (removeCover) {
    updates.cover_url = null;
  } else if (coverUrl) {
    if (!isOwnBookImageUrl(coverUrl, user.id, id)) {
      return { error: t.errors.invalidImageSource };
    }
    updates.cover_url = coverUrl;
  }

  // Kapak değişiyorsa, güncellemeden sonra silinecek eski kapağı önce oku.
  let previousCover: string | null = null;
  if (removeCover || coverUrl) {
    const { data: current } = await supabase
      .from("books")
      .select("cover_url")
      .eq("id", id)
      .maybeSingle();
    previousCover = current?.cover_url ?? null;
  }

  const { error } = await supabase.from("books").update(updates).eq("id", id);

  if (error) {
    if (coverUrl) {
      await removeImages(supabase, [ownImagePath(coverUrl, user.id, id)]);
    }
    return { error: error.message };
  }

  if (previousCover && previousCover !== coverUrl) {
    await removeImages(supabase, [ownImagePath(previousCover, user.id, id)]);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/books/${id}`);
  return { ok: true };
}

// Kitabı sil. İlişkili karakter/mekan/alıntılar DB'de ON DELETE CASCADE ile
// otomatik temizlenir (PRD Bölüm 2). RLS sahipliği zorunlu kılar.
// CASCADE Storage'a ulaşmaz: kitabın görsel klasörü ayrıca silinir.
export async function deleteBook(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  // .select: gerçekten silinen satırı döndürür. RLS başkasının kitabını 0
  // satırla "sessizce" reddeder; o durumda klasöre dokunulmaz.
  const { data: deleted, error } = await supabase
    .from("books")
    .delete()
    .eq("id", id)
    .select("id");

  if (!error && deleted && deleted.length > 0) {
    await removeBookFolder(supabase, user.id, id);
  }

  revalidatePath("/dashboard");
}
