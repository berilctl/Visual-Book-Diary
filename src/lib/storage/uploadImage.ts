import "server-only";
import { createClient } from "@/lib/supabase/server";
import { BOOK_IMAGES_BUCKET as BUCKET } from "./url";

// Every image upload in the app goes through this single function.

// File extension from the content type, so png/jpeg/webp uploads keep their
// real format.
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Writes image bytes to `{userId}/{bookId}/{uuid}.{ext}` in Storage and
 * returns a permanent public URL.
 *
 * `userId` must come from a server-side `auth.getUser()` in the calling route,
 * never from the client. The upload runs through the user's cookie-backed
 * Supabase client so that the "own folder upload" Storage policy can check the
 * first path segment against auth.uid().
 */
export async function uploadImage(
  bytes: Buffer,
  userId: string,
  bookId: string,
  contentType = "image/png",
): Promise<string> {
  const ext = EXT_BY_TYPE[contentType] ?? "png";
  const path = `${userId}/${bookId}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });

  if (error) {
    throw new Error(`Görsel Storage'a yüklenemedi: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}
