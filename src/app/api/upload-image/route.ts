import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/storage/uploadImage";
import { getDictionary } from "@/lib/i18n/server";
import { IMAGE_MAX_MB, imageFileProblem } from "@/lib/storage/limits";

// Headroom for the upload plus the Storage write.
export const maxDuration = 30;


// Image upload endpoint.
// Flow: session check -> book ownership -> type and size validation ->
// uploadImage() -> permanent public URL.
export async function POST(request: Request) {
  const t = await getDictionary();
  const supabase = await createClient();

  // 1. Authenticate the user.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: t.upload.unauthorized }, { status: 401 });
  }

  // Parse the request body.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: t.upload.badBody },
      { status: 400 },
    );
  }

  const bookId = String(formData.get("book_id") ?? "").trim();
  const file = formData.get("file");

  if (!bookId) {
    return NextResponse.json({ error: t.upload.bookIdRequired }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: t.upload.fileMissing }, { status: 400 });
  }

  // 2. Verify ownership of book_id. RLS covers this too; here it gives a clear 403.
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) {
    return NextResponse.json(
      { error: t.errors.bookNotFound },
      { status: 403 },
    );
  }

  // 3. Server-side type and size validation. The rules live in
  //    lib/storage/limits.ts; forms warn early with the same rules, but this is
  //    where they are enforced.
  const problem = imageFileProblem(file);
  if (problem === "type") {
    return NextResponse.json({ error: t.upload.badType }, { status: 415 });
  }
  if (problem === "empty") {
    return NextResponse.json({ error: t.upload.emptyFile }, { status: 400 });
  }
  if (problem === "size") {
    return NextResponse.json(
      { error: t.upload.tooLarge(IMAGE_MAX_MB) },
      { status: 413 },
    );
  }

  // 4. Upload and return the permanent public URL. userId comes from the session.
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(bytes, user.id, bookId, file.type);
    return NextResponse.json({ url }, { status: 201 });
  } catch (e) {
    // The raw Storage error goes to the server log only; internal details
    // (bucket, path, policy message) are not leaked to the client.
    console.error("[upload-image]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: t.upload.failed }, { status: 500 });
  }
}
