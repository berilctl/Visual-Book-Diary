"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string } | undefined;

// Login — email/şifre. Başarıda /dashboard'a yönlendir.
export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifre zorunludur." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-posta veya şifre hatalı." };
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
  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalıdır." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
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
