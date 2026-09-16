"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  findEmailByUsername,
  findUserIdByUsername,
} from "@/lib/supabase/username-lookup";
import { getDictionary } from "@/lib/i18n/server";
import { USERNAME_MAX, USERNAME_MIN, isValidUsername } from "@/lib/username";

export type AuthState = { error?: string; notice?: string } | undefined;

// Kullanıcı adı yok / e-posta yok / şifre yanlış — hepsi aynı mesaj
// (t.auth.loginFailed). Böylece giriş formu, bir kullanıcı adının hangi
// e-postaya bağlı olduğunu ya da hatanın şifreden mi hesaptan mı olduğunu
// belli etmez.

// Login — e-posta VEYA kullanıcı adı + şifre. "@" içeren giriş e-posta,
// içermeyen kullanıcı adı sayılır (kullanıcı adında "@" izinli değil).
// Başarıda /dashboard'a yönlendir.
export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const t = await getDictionary();
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: t.auth.loginRequired };
  }

  let email = identifier;
  if (!identifier.includes("@")) {
    const lookup = await findEmailByUsername(identifier);
    if (!lookup.ok) return { error: t.errors.serviceUnavailable };
    if (!lookup.value) return { error: t.auth.loginFailed };
    email = lookup.value;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: t.auth.loginFailed };
  }

  redirect("/dashboard");
}

// Register — username raw_user_meta_data'ya geçer; handle_new_user trigger'ı
// onu profiles tablosuna yazar (PRD Bölüm 5.1).
export async function register(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const t = await getDictionary();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !email || !password) {
    return { error: t.auth.registerRequired };
  }
  if (!isValidUsername(username)) {
    return {
      error: t.auth.usernameInvalid(
        t.auth.usernameHint(USERNAME_MIN, USERNAME_MAX),
      ),
    };
  }
  if (password.length < 6) {
    return { error: t.auth.passwordTooShort };
  }

  // Asıl garanti veritabanındaki benzersiz index; bu ön kontrol yalnızca
  // anlaşılır bir mesaj vermek için.
  const existing = await findUserIdByUsername(username);
  if (!existing.ok) return { error: t.errors.serviceUnavailable };
  if (existing.value) return { error: t.auth.usernameTaken };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    // Ön kontrolle signUp arasında aynı adı başkası aldıysa benzersiz index
    // handle_new_user trigger'ındaki insert'i düşürür; Supabase bunu yalnızca
    // bu genel mesajla bildirir.
    if (/database error saving new user/i.test(error.message)) {
      return { error: t.auth.usernameRace };
    }
    // Supabase Auth'un kendi mesajı (ör. geçersiz e-posta); yalnızca
    // İngilizce döner, bilinmeyen hata türlerini çeviremiyoruz.
    return { error: error.message };
  }

  // E-posta onayı kapalıysa oturum hemen açılır -> dashboard.
  // Açıksa session null döner -> kullanıcıyı bilgilendir.
  if (data.session) {
    redirect("/dashboard");
  }

  return { notice: t.auth.signupNotice };
}

// Logout — oturumu kapat ve landing'e dön.
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
