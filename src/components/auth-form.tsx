"use client";

import { useActionState, useState } from "react";
import { login, register, type AuthState } from "@/app/actions/auth";
import { buttonClass } from "@/components/ui/button";
import { cardClass } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import {
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_PATTERN,
} from "@/lib/username";
import { useI18n } from "@/components/i18n-provider";

type Mode = "login" | "register";

export function AuthForm() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const usernameHint = t.auth.usernameHint(USERNAME_MIN, USERNAME_MAX);

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
          { value: "login", label: t.auth.login },
          { value: "register", label: t.auth.register },
        ]}
      />

      {/* key={mode} formu mod değişince sıfırlar. */}
      <form
        key={mode}
        action={isLogin ? loginAction : registerAction}
        className="flex flex-col gap-4"
      >
        {isLogin ? (
          // Tek alan: "@" içeriyorsa e-posta, içermiyorsa kullanıcı adı.
          // type="text" şart — type="email" kullanıcı adını tarayıcıda
          // gönderilmeden reddediyordu.
          <Field label={t.auth.identifier} required>
            <Input
              name="identifier"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t.auth.usernamePlaceholder}
            />
          </Field>
        ) : (
          <>
            <Field label={t.auth.username} required hint={usernameHint}>
              <Input
                name="username"
                type="text"
                required
                minLength={USERNAME_MIN}
                maxLength={USERNAME_MAX}
                pattern={USERNAME_PATTERN}
                title={usernameHint}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t.auth.usernamePlaceholder}
              />
            </Field>
            <Field label={t.auth.email} required>
              <Input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t.auth.emailPlaceholder}
              />
            </Field>
          </>
        )}
        <Field label={t.auth.password} required>
          <Input
            name="password"
            type="password"
            required
            minLength={isLogin ? undefined : 6}
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
          {pending
            ? t.auth.pleaseWait
            : isLogin
              ? t.auth.login
              : t.auth.register}
        </button>
      </form>
    </div>
  );
}
