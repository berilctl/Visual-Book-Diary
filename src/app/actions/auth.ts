"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  findEmailByUsername,
  findUserIdByUsername,
} from "@/lib/supabase/username-lookup";
import { USERNAME_HINT, isValidUsername } from "@/lib/username";

export type AuthState = { error?: string; notice?: string } | undefined;

// Kullanıcı adı yok / e-posta yok / şifre yanlış — hepsi aynı mesaj. Böylece
// giriş formu, bir kullanıcı adının hangi e-postaya bağlı olduğunu ya da
// şifrenin mi hesabın mı yanlış olduğunu belli etmez.
const LOGIN_FAILED = "E-posta/kullanıcı adı veya şifre hatalı.";
const SERVICE_UNAVAILABLE = "Şu an işlem yapılamıyor, lütfen tekrar dene.";

// Login — e-posta VEYA kullanıcı adı + şifre. "@" içeren giriş e-posta,
// içermeyen kullanıcı adı sayılır (kullanıcı adında "@" izinli değil).
// Başarıda /dashboard'a yönlendir.
export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "E-posta/kullanıcı adı ve şifre zorunludur." };
  }

  let email = identifier;
  if (!identifier.includes("@")) {
    const lookup = await findEmailByUsername(identifier);
    if (!lookup.ok) return { error: SERVICE_UNAVAILABLE };
    if (!lookup.value) return { error: LOGIN_FAILED };
    email = lookup.value;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: LOGIN_FAILED };
  }

  redirect("/dashboard");
}

// Register — username raw_user_meta_data'ya geçer; handle_new_user trigger'ı
// onu profiles tablosuna yazar (PRD Bölüm 5.1).
export async function register(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !email || !password) {
    return { error: "Kullanıcı adı, e-posta ve şifre zorunludur." };
  }
  if (!isValidUsername(username)) {
    return { error: `Kullanıcı adı geçersiz. ${USERNAME_HINT}` };
  }
  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalıdır." };
  }

  // Asıl garanti veritabanındaki benzersiz index; bu ön kontrol yalnızca
  // anlaşılır bir mesaj vermek için.
  const existing = await findUserIdByUsername(username);
  if (!existing.ok) return { error: SERVICE_UNAVAILABLE };
  if (existing.value) return { error: "Bu kullanıcı adı alınmış." };

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
      return {
        error: "Kayıt tamamlanamadı; kullanıcı adı az önce alınmış olabilir.",
      };
    }
    return { error: error.message };
  }

  // E-posta onayı kapalıysa oturum hemen açılır -> dashboard.
  // Açıksa session null döner -> kullanıcıyı bilgilendir.
  if (data.session) {
    redirect("/dashboard");
  }

  return {
    notice:
      "Hesabın oluşturuldu. E-postanı onayladıktan sonra giriş yapabilirsin.",
  };
}

// Logout — oturumu kapat ve landing'e dön.
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
