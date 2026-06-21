import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/storage/uploadImage";

// PRD Bölüm 6.4 — yükleme + Storage yazımı için zaman marjı.
export const maxDuration = 30;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Giriş 1 — Dosya yükleme (PRD Bölüm 6.2).
// Akış: oturum kontrolü -> book_id sahipliği -> tip/boyut validasyonu ->
// uploadImage() -> kalıcı public URL.
export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Kullanıcıyı doğrula.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz. Giriş gerekli." }, { status: 401 });
  }

  // İstek gövdesini çöz.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi (multipart/form-data bekleniyor)." },
      { status: 400 },
    );
  }

  const bookId = String(formData.get("book_id") ?? "").trim();
  const file = formData.get("file");

  if (!bookId) {
    return NextResponse.json({ error: "book_id zorunludur." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }

  // 2. book_id sahipliğini doğrula. RLS de korur; burada net 403 dönüyoruz.
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) {
    return NextResponse.json(
      { error: "Kitap bulunamadı veya bu kitaba erişimin yok." },
      { status: 403 },
    );
  }

  // 3. Tip ve boyut validasyonu (server-side).
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Yalnızca PNG, JPEG veya WEBP yüklenebilir." },
      { status: 415 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Dosya boş." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Dosya 5 MB sınırını aşıyor." },
      { status: 413 },
    );
  }

  // 4. uploadImage() -> kalıcı public URL. userId server-side oturumdan.
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(bytes, user.id, bookId, file.type);
    return NextResponse.json({ url }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Yükleme başarısız oldu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
