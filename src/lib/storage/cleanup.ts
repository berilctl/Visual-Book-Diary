import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { BOOK_IMAGES_BUCKET } from "./url";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Removes images from Storage once no row references them.
//
// - Runs with the user's authenticated client: the "own folder delete" Storage
//   policy only allows files inside their own folder (callers also validate the
//   paths with ownImagePath first).
// - Best effort: if cleanup fails, the user's actual operation (save, delete)
//   still succeeds; the failure is logged and the file is left orphaned.
// - Callers invoke this only AFTER the database write succeeded, otherwise a
//   surviving row could point at a deleted file.
export async function removeImages(
  supabase: Supabase,
  paths: (string | null | undefined)[],
): Promise<void> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (unique.length === 0) return;

  const { error } = await supabase.storage
    .from(BOOK_IMAGES_BUCKET)
    .remove(unique);
  if (error) {
    console.error("[storage-cleanup] remove failed:", error.message, unique);
  }
}

const PAGE_SIZE = 100;

// Deleting a book orphans its whole {userId}/{bookId}/ folder (cover plus
// character and location images): the rows go away through CASCADE, the files
// do not. Every page is listed before anything is removed — deleting while
// listing would shift the offset and skip files.
export async function removeBookFolder(
  supabase: Supabase,
  userId: string,
  bookId: string,
): Promise<void> {
  const folder = `${userId}/${bookId}`;
  const paths: string[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.storage
      .from(BOOK_IMAGES_BUCKET)
      .list(folder, { limit: PAGE_SIZE, offset });
    if (error) {
      console.error("[storage-cleanup] list failed:", error.message, folder);
      break;
    }
    // Entries without an id are folder records; only files are removed.
    for (const item of data) {
      if (item.id) paths.push(`${folder}/${item.name}`);
    }
    if (data.length < PAGE_SIZE) break;
  }

  await removeImages(supabase, paths);
}
