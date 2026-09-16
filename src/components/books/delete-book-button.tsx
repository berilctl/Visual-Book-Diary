"use client";

import { deleteBook } from "@/app/actions/books";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Silme — onay penceresi CASCADE etkisini (karakter, mekan, alıntı ve
// görseller de gider) kullanıcıya hatırlatır (PRD Bölüm 2).
export function DeleteBookButton({ id, title }: { id: string; title: string }) {
  const { t } = useI18n();

  return (
    <ConfirmDialog
      triggerLabel={t.common.delete}
      triggerClassName={buttonClass({ variant: "danger", size: "sm" })}
      title={t.book.deleteTitle}
      body={t.book.deleteBody(title)}
      confirmLabel={t.common.delete}
      onConfirm={async () => {
        const formData = new FormData();
        formData.set("id", id);
        await deleteBook(formData);
      }}
    />
  );
}
