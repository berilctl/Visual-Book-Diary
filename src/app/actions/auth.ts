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

// Unknown username, unknown email and wrong password all return the same
// message (t.auth.loginFailed), so the form cannot reveal which email a
// username belongs to, or whether it was the password or the account that
// was wrong.

// Sign in with an email address OR a username, plus a password. An identifier
// containing "@" is treated as an email, anything else as a username ("@" is
// not allowed in usernames). On success, redirect to /dashboard.
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

// Sign up. The username travels in raw_user_meta_data; the handle_new_user
// trigger copies it into the profiles table.
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

  // The unique index in the database is the real guarantee; this check only
  // exists to produce a readable message.
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
    // Sign-ups turned off in the project, or a Before User Created hook
    // rejecting the request with this code (an account cap, for example).
    if (error.code === "signup_disabled") {
      return { error: t.auth.signupsClosed };
    }
    // If someone else took the name between this check and signUp, the unique
    // index makes the insert in handle_new_user fail, and Supabase only reports
    // it through this generic message.
    if (/database error saving new user/i.test(error.message)) {
      return { error: t.auth.usernameRace };
    }
    // A message from Supabase Auth itself (an invalid email, for example). These
    // only come back in English; unknown error types cannot be translated.
    return { error: error.message };
  }

  // With email confirmation disabled the session starts right away -> dashboard.
  // With it enabled, session is null -> tell the user to check their inbox.
  if (data.session) {
    redirect("/dashboard");
  }

  return { notice: t.auth.signupNotice };
}

// Sign out and return to the landing page.
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
