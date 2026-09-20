"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  FINISHABLE_STATUSES,
  RATING_MAX,
  RATING_MIN,
  isBookStatus,
  type BookStatus,
} from "@/lib/books";
import { getDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { removeBookFolder, removeImages } from "@/lib/storage/cleanup";
import { isOwnBookImageUrl, ownImagePath } from "@/lib/storage/url";

// id: the new book's id once createBook succeeds, used for the cover upload.
export type BookFormState =
  | { ok?: boolean; error?: string; id?: string }
  | undefined;

// Reads and validates the finish date from the form. The field is only present
// while the status is "completed"; otherwise present=false and the stored value
// is left alone. An empty field means null (an old book whose date is unknown).
// The value has to be a real calendar date, cannot be in the future (with one
// day of timezone slack) and cannot precede the start date.
function parseFinishedAt(
  formData: FormData,
  startDate: string | null,
  t: Dictionary,
):
  | { ok: true; present: boolean; value: string | null }
  | { ok: false; error: string } {
  if (!formData.has("finished_at")) {
    return { ok: true, present: false, value: null };
  }
  const raw = String(formData.get("finished_at") ?? "").trim();
  if (!raw) return { ok: true, present: true, value: null };

  const parsed = Date.parse(`${raw}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(raw) ||
    Number.isNaN(parsed) ||
    new Date(parsed).toISOString().slice(0, 10) !== raw
  ) {
    return { ok: false, error: t.book.finishedAtInvalid };
  }

  const serverDay = Date.parse(
    `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
  );
  if (parsed - serverDay > 86_400_000) {
    return { ok: false, error: t.book.finishedAtFuture };
  }
  // ISO 'YYYY-MM-DD' strings also compare correctly in lexicographic order.
  if (startDate && raw < startDate) {
    return { ok: false, error: t.book.finishedBeforeStart };
  }
  return { ok: true, present: true, value: raw };
}

function parseBookFields(
  formData: FormData,
  t: Dictionary,
):
  | {
      ok: true;
      title: string;
      author: string;
      start_date: string | null;
      status: BookStatus;
      finished: { present: boolean; value: string | null };
    }
  | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();

  if (!title || !author) {
    return { ok: false, error: t.book.titleAuthorRequired };
  }

  const start_date = String(formData.get("start_date") ?? "").trim() || null;
  const rawStatus = formData.get("status");
  const status: BookStatus = isBookStatus(rawStatus) ? rawStatus : "reading";

  const finished = parseFinishedAt(formData, start_date, t);
  if (!finished.ok) return finished;

  return {
    ok: true,
    title,
    author,
    start_date,
    status,
    finished: { present: finished.present, value: finished.value },
  };
}

// The client's local day (the "today" field). It comes from the client so the
// finish date follows the user's own calendar, but it is not trusted blindly:
// the format and the date itself are validated (2026-02-31 is rejected) and it
// may differ from the server's UTC day by at most one day (timezone offsets
// span ±14 hours). Anything else falls back to the server's day.
function clientLocalDate(raw: FormDataEntryValue | null): string {
  const serverDay = new Date().toISOString().slice(0, 10);
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return serverDay;
  }
  const parsed = Date.parse(`${raw}T00:00:00Z`);
  if (
    Number.isNaN(parsed) ||
    new Date(parsed).toISOString().slice(0, 10) !== raw
  ) {
    return serverDay;
  }
  const dayDiff =
    Math.abs(parsed - Date.parse(`${serverDay}T00:00:00Z`)) / 86_400_000;
  return dayDiff <= 1 ? raw : serverDay;
}

// Creates a book. user_id NEVER comes from the client — it comes from the session.
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

  // The cover is attached in a second step: the upload pipeline writes into an
  // existing book's folder, so the client needs the id first.
  const { data, error } = await supabase
    .from("books")
    .insert({
      user_id: user.id,
      title: fields.title,
      author: fields.author,
      start_date: fields.start_date,
      status: fields.status,
      ...(fields.finished.present && { finished_at: fields.finished.value }),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

// Updates an existing book. Row-level security guarantees a user can only
// update their own.
//
// Cover (optional): a "cover_url" is accepted only from the user's folder for
// this book; "remove_cover=1" clears it. With neither present the cover is
// left untouched.
//
// Storage cleanup: on success the replaced cover file is removed, on failure
// the freshly uploaded file that never got linked to a row.
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

  // The finish date comes from the form, where the field only appears for
  // "completed". Writing today's date on the server instead would put the
  // wrong date on a book that was finished months ago.
  if (fields.finished.present) {
    updates.finished_at = fields.finished.value;
  }

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

  // If the cover changes, read the old one before updating so it can be removed after.
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

// Marks a book as finished and records the finish day. It only applies to
// books that are being read or paused, so the finish date of an already
// completed book is never overwritten by a double click or a stale tab.
export async function finishBook(
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

  const { data, error } = await supabase
    .from("books")
    .update({
      status: "completed",
      finished_at: clientLocalDate(formData.get("today")),
    })
    .eq("id", id)
    .in("status", [...FINISHABLE_STATUSES])
    .select("id");

  if (error) return { error: error.message };
  // 0 rows: no such book, someone else's (RLS), or already finished.
  if (!data || data.length === 0) return { error: t.errors.bookNotFound };

  revalidatePath("/dashboard");
  revalidatePath(`/books/${id}`);
  return { ok: true };
}

// A 1–5 star rating, for finished books only. The range is enforced by a CHECK
// constraint in the database as well.
export async function rateBook(
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

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
    return { error: t.rating.invalid };
  }

  const { data, error } = await supabase
    .from("books")
    .update({ rating })
    .eq("id", id)
    .eq("status", "completed")
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: t.rating.onlyCompleted };

  revalidatePath("/dashboard");
  revalidatePath(`/books/${id}`);
  return { ok: true };
}

// Deletes a book. Its characters, locations and quotes go with it through
// ON DELETE CASCADE, and row-level security enforces ownership. CASCADE does
// not reach Storage, so the book's image folder is removed separately.
export async function deleteBook(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  // .select returns the row that was actually deleted. RLS rejects someone
  // else's book silently with 0 rows, and then no folder is touched.
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
