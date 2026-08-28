"use client";

import { useActionState, useState } from "react";
import { login, register, type AuthState } from "@/app/actions/auth";
import { buttonClass } from "@/components/ui/button";
import { cardClass } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";

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
    <div className={`w-full max-w-sm p-8 ${cardClass}`}>
      <Segmented<Mode>
        className="mb-6"
        value={mode}
        onChange={setMode}
        options={[
          { value: "login", label: "Giriş Yap" },
          { value: "register", label: "Kayıt Ol" },
        ]}
      />

      {/* key={mode} formu mod değişince sıfırlar. */}
      <form
        key={mode}
        action={isLogin ? loginAction : registerAction}
        className="flex flex-col gap-4"
      >
        {!isLogin && (
          <Field label="Kullanıcı adı" required>
            <Input
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="okur123"
            />
          </Field>
        )}
        <Field label="E-posta" required>
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ornek@eposta.com"
          />
        </Field>
        <Field label="Şifre" required>
          <Input
            name="password"
            type="password"
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="••••••••"
          />
        </Field>

        {state?.error && (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        )}
        {state?.notice && (
          <p className="text-sm text-success" role="status">
            {state.notice}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ className: "mt-1 w-full" })}
        >
          {pending ? "Lütfen bekleyin…" : isLogin ? "Giriş Yap" : "Kayıt Ol"}
        </button>
      </form>
    </div>
  );
}
