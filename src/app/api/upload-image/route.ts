import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/storage/uploadImage";
import { getDictionary } from "@/lib/i18n/server";
import { IMAGE_MAX_MB, imageFileProblem } from "@/lib/storage/limits";

// Yükleme + Storage yazımı için zaman marjı.
export const maxDuration = 30;


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

  // 3. Tip ve boyut validasyonu (server-side). Kurallar lib/storage/limits.ts'te;
  // formlar aynı kuralla erken uyarı verir ama yetki buradadır.
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
