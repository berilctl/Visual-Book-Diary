"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Stores the chosen language in a cookie. Called as a form action, Next
// returns the re-rendered interface in the same request, so no extra
// router.refresh() is needed.
export async function setLocale(formData: FormData): Promise<void> {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    // Client code never reads the cookie; the locale reaches the provider as a prop from the layout.
    httpOnly: true,
  });
}
