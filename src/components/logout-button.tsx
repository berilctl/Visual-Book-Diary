"use client";

import { logout } from "@/app/actions/auth";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export function LogoutButton() {
  const { t } = useI18n();
  return (
    <form action={logout}>
      <button type="submit" className={buttonClass({ variant: "secondary" })}>
        {t.common.logout}
      </button>
    </form>
  );
}
