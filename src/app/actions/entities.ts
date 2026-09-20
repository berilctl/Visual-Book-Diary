"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isEntityKind } from "@/lib/entities";
import { getDictionary } from "@/lib/i18n/server";
import { removeImages } from "@/lib/storage/cleanup";
import { ownImagePath } from "@/lib/storage/url";

export type EntityFormState = { ok?: boolean; error?: string } | undefined;

// "Vampire, Antagonist" -> ["Vampire", "Antagonist"] (trimmed, no blanks, deduplicated).
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

// Creates a character or location card. image_url is the permanent Storage URL
// of a file the client uploaded to /api/upload-image first, and is optional.
// user_id comes from the session; row-level security enforces book ownership.
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

  // Ownership of book_id. RLS covers this too; here it gives a clear error.
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

  // image_url may only come from the user's Storage folder for this book —
  // external URLs are not supported. Checking the bucket prefix alone would
  // also accept another user's image address.
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
    // The uploaded image could not be linked to any row; don't leave it orphaned.
    await removeImages(supabase, [imagePath]);
    return { error: error.message };
  }

  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

// Updates a character or location card, with the same guards as createEntity:
// the kind allowlist, book ownership, the Storage path check when image_url
// changes, and row-level security. image_url is only written when a new image
// is supplied; an empty value keeps the current one.
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

  // Ownership of book_id. RLS covers this too; here it gives a clear error.
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

  // image_url is only updated when a new image was supplied, and then only
  // from the user's folder for this book (same rule as createEntity).
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const imagePath = imageUrl ? ownImagePath(imageUrl, user.id, bookId) : null;
  let previousImage: string | null = null;
  if (imageUrl) {
    if (!imagePath) {
      return { error: t.errors.invalidImageSource };
    }
    updates.image_url = imageUrl;

  // Read the image that is about to be replaced so it can be removed afterwards.
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

  // The replaced image is no longer used. Scoped to the user's folder: the
  // row's book may not be the bookId that came from the form.
  if (previousImage && previousImage !== imageUrl) {
    await removeImages(supabase, [ownImagePath(previousImage, user.id)]);
  }

  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

// Deletes a character or location card. Row-level security enforces ownership,
// and the card's image is removed from Storage as well.
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

  // .select returns the image of the row that was really deleted (RLS rejects
  // someone else's card with 0 rows, and then no file is touched).
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
