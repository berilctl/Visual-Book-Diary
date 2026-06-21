"use client";

import { useActionState, useState } from "react";
import { login, register, type AuthState } from "@/app/actions/auth";

type Mode = "login" | "register";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");

  // Her mod kendi action state'ini tutar.
  const [loginState, loginAction, loginPending] = useActionState<
    AuthState,
    FormData
  >(login, undefined);
  const [registerState, registerAction, registerPending] = useActionState<
    AuthState,
    FormData
  >(register, undefined);

  const isLogin = mode === "login";
  const state = isLogin ? loginState : registerState;
  const pending = isLogin ? loginPending : registerPending;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="mb-6 flex gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/5">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            isLogin ? "bg-white shadow-sm dark:bg-neutral-800" : "opacity-60"
          }`}
        >
          Giriş Yap
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            !isLogin ? "bg-white shadow-sm dark:bg-neutral-800" : "opacity-60"
          }`}
        >
          Kayıt Ol
        </button>
      </div>

      {/* key={mode} formu mod değişince sıfırlar. */}
      <form
        key={mode}
        action={isLogin ? loginAction : registerAction}
        className="flex flex-col gap-3"
      >
        {!isLogin && (
          <Field
            label="Kullanıcı adı"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="okur123"
          />
        )}
        <Field
          label="E-posta"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ornek@eposta.com"
        />
        <Field
          label="Şifre"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder="••••••••"
        />

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
        {state?.notice && (
          <p className="text-sm text-green-700 dark:text-green-400">
            {state.notice}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {pending
            ? "Lütfen bekleyin…"
            : isLogin
              ? "Giriş Yap"
              : "Kayıt Ol"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        {...props}
        required
        className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
      />
    </label>
  );
}
