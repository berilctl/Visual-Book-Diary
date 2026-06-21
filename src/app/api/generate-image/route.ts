import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/storage/uploadImage";
import { generateImage } from "@/lib/ai/generateImage";

// PRD Bölüm 6.4 — üretim (~5-15 sn) + indirme + Storage yazımı için marj.
export const maxDuration = 60;

const MAX_PROMPT = 1000;

// Giriş 2 — AI üretimi (PRD Bölüm 6.3).
// Akış: oturum -> book_id sahipliği + prompt validasyonu -> generateImage()
// -> uploadImage() (geçici sağlayıcı URL'i DB'ye YAZILMAZ, byte re-host edilir)
// -> kalıcı public URL dön. Satırın oluşturulması createEntity'de yapılır
// (upload akışıyla simetrik; tek doğrulanan insert yolu).
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz. Giriş gerekli." }, { status: 401 });
  }

  let body: { book_id?: unknown; prompt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi (JSON bekleniyor)." },
      { status: 400 },
    );
  }

  const bookId = typeof body.book_id === "string" ? body.book_id.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!bookId) {
    return NextResponse.json({ error: "book_id zorunludur." }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json(
      { error: "Görsel için bir betimleme yaz." },
      { status: 400 },
    );
  }
  if (prompt.length > MAX_PROMPT) {
    return NextResponse.json(
      { error: `Betimleme çok uzun (en fazla ${MAX_PROMPT} karakter).` },
      { status: 400 },
    );
  }

  // book_id sahipliği. RLS de korur; burada net 403 dönüyoruz.
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

  try {
    const bytes = await generateImage(prompt);
    const url = await uploadImage(bytes, user.id, bookId); // png (varsayılan)
    return NextResponse.json({ url }, { status: 201 });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "";
    return NextResponse.json({ error: friendlyError(raw) }, { status: 502 });
  }
}

// Sağlayıcı hatalarını kullanıcıya anlaşılır mesaja çevir (sessizce patlama).
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("402") ||
    m.includes("payment") ||
    m.includes("insufficient") ||
    m.includes("credit") ||
    m.includes("billing")
  ) {
    return "Replicate kredisi yetersiz görünüyor. Lütfen hesabını kontrol et.";
  }
  if (
    m.includes("401") ||
    m.includes("403") ||
    m.includes("unauthorized") ||
    m.includes("authentication") ||
    m.includes("token")
  ) {
    return "AI sağlayıcı kimlik doğrulaması başarısız (API token'ı kontrol et).";
  }
  if (
    m.includes("timeout") ||
    m.includes("timed out") ||
    m.includes("etimedout") ||
    m.includes("aborted")
  ) {
    return "Görsel üretimi zaman aşımına uğradı. Lütfen tekrar dene.";
  }
  if (m.includes("rate") && m.includes("limit")) {
    return "Çok fazla istek gönderildi. Bir süre sonra tekrar dene.";
  }
  return "Görsel üretilemedi. Lütfen tekrar dene.";
}
