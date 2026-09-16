"use client";

import { deleteBook } from "@/app/actions/books";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

// Silme — onay sorar ve CASCADE etkisini kullanıcıya hatırlatır (PRD Bölüm 2).
export function DeleteBookButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const { t } = useI18n();
  return (
    <form
      action={deleteBook}
      onSubmit={(e) => {
        const ok = window.confirm(t.book.deleteConfirm(title));
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        idleLabel={t.common.delete}
        pendingLabel={t.common.deleting}
        className={buttonClass({ variant: "danger", size: "sm" })}
      />
    </form>
  );
}
