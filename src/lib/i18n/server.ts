import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, matchLocale, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

// Server Component, Server Action ve Route Handler'larda geçerli dil.
// Öncelik: kullanıcının seçtiği dil (çerez) -> tarayıcı dili
// (Accept-Language) -> varsayılan (tr).
//
// Not: cookies()/headers() okumak, bu fonksiyonu çağıran sayfaları dinamik
// render'a geçirir (Next 16 dokümanı). Uygulamanın giriş sonrası sayfaları
// zaten oturum çerezi yüzünden dinamik; yalnızca landing statikten dinamiğe
// geçiyor.
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const chosen = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;

  const headerStore = await headers();
  return matchLocale(headerStore.get("accept-language"));
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}
