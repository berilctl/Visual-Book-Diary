import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, matchLocale, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

// The active locale in Server Components, Server Actions and Route Handlers.
// Precedence: the language the user picked (cookie) -> the browser's language
// (Accept-Language) -> the default (tr).
//
// Note: reading cookies()/headers() opts callers into dynamic rendering. Pages
// behind the session cookie are dynamic anyway; only the landing page moves
// from static to dynamic because of this.
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
