"use client";

import { logout } from "@/app/actions/auth";
import { buttonClass } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className={buttonClass({ variant: "secondary" })}>
        Çıkış Yap
      </button>
    </form>
  );
}
