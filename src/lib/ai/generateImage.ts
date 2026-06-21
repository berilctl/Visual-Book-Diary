import "server-only";
import Replicate from "replicate";

// Sağlayıcı-bağımsız soyutlama. Sağlayıcıyı değiştirmek BU dosyada başlar ve
// biter — Replicate'e özel hiçbir tip/çağrı dışarı sızmaz (PRD Bölüm 3 & 6.3).

const MODEL = "black-forest-labs/flux-schnell";

/**
 * Verilen prompt'tan görsel üretir ve ham byte'ları (PNG) döner.
 * Sağlayıcının döndürdüğü URL/stream geçicidir; çağıran taraf byte'ları
 * uploadImage() ile kalıcı Storage'a re-host eder (PRD altın kuralı).
 */
export async function generateImage(prompt: string): Promise<Buffer> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("AI sağlayıcı yapılandırılmamış (REPLICATE_API_TOKEN yok).");
  }

  // useFileOutput: false -> çıktı, FileOutput stream'i yerine düz URL string'i
  // olur; bu, sürümler arası en kararlı biçimdir.
  const replicate = new Replicate({ auth: token, useFileOutput: false });

  const output = await replicate.run(MODEL, { input: { prompt } });

  return toImageBuffer(output);
}

// Çıktıyı (string URL / URL / Blob / FileOutput / dizi) Buffer'a indirger.
async function toImageBuffer(output: unknown): Promise<Buffer> {
  const item = Array.isArray(output) ? output[0] : output;
  if (item == null) {
    throw new Error("AI çıktısı boş döndü.");
  }

  if (typeof item === "string") {
    return fetchToBuffer(item);
  }
  if (item instanceof URL) {
    return fetchToBuffer(item.toString());
  }

  // Blob veya arrayBuffer'a sahip nesne.
  if (hasMethod(item, "arrayBuffer")) {
    const ab = (await item.arrayBuffer()) as ArrayBuffer;
    return Buffer.from(ab);
  }
  // FileOutput.blob()
  if (hasMethod(item, "blob")) {
    const blob = (await item.blob()) as Blob;
    return Buffer.from(await blob.arrayBuffer());
  }
  // FileOutput.url()
  if (hasMethod(item, "url")) {
    const u = item.url();
    return fetchToBuffer(u instanceof URL ? u.toString() : String(u));
  }

  throw new Error("AI çıktısı beklenmeyen biçimde döndü.");
}

async function fetchToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Üretilen görsel indirilemedi (HTTP ${res.status}).`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function hasMethod(
  value: unknown,
  name: string,
): value is Record<string, (...args: unknown[]) => unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>)[name] === "function"
  );
}
