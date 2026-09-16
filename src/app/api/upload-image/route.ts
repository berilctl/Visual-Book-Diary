import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/storage/uploadImage";
import { getDictionary } from "@/lib/i18n/server";

// Yükleme + Storage yazımı için zaman marjı.
export const maxDuration = 30;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// Dosya yükleme (PRD Bölüm 6.2).
// Akış: oturum kontrolü -> book_id sahipliği -> tip/boyut validasyonu ->
// uploadImage() -> kalıcı public URL.
export async function POST(request: Request) {
  const t = await getDictionary();
  const supabase = await createClient();

  // 1. Kullanıcıyı doğrula.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: t.upload.unauthorized }, { status: 401 });
  }

  // İstek gövdesini çöz.
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

  // 2. book_id sahipliğini doğrula. RLS de korur; burada net 403 dönüyoruz.
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

  // 3. Tip ve boyut validasyonu (server-side).
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: t.upload.badType },
      { status: 415 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: t.upload.emptyFile }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: t.upload.tooLarge(MAX_MB) },
      { status: 413 },
    );
  }

  // 4. uploadImage() -> kalıcı public URL. userId server-side oturumdan.
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(bytes, user.id, bookId, file.type);
    return NextResponse.json({ url }, { status: 201 });
  } catch (e) {
    // Ham Storage hatası yalnızca sunucu loguna; istemciye iç ayrıntı
    // (bucket/yol/politika mesajı) sızdırılmaz.
    console.error("[upload-image]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: t.upload.failed }, { status: 500 });
  }
}
