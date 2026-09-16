"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Dil seçimini çereze yazar. Form action'ı olarak çağrıldığında Next,
// güncel arayüzü aynı istekte geri döner (Next 16 cookies dokümanı), bu yüzden
// ayrıca router.refresh() gerekmez.
export async function setLocale(formData: FormData): Promise<void> {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    // İstemci kodu çereze erişmiyor; dil, layout'tan provider'a prop olarak geliyor.
    httpOnly: true,
  });
}
