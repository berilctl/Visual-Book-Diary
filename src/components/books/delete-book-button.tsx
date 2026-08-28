"use client";

import { deleteBook } from "@/app/actions/books";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClass } from "@/components/ui/button";

// Silme — onay sorar ve CASCADE etkisini kullanıcıya hatırlatır (PRD Bölüm 2).
export function DeleteBookButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <form
      action={deleteBook}
      onSubmit={(e) => {
        const ok = window.confirm(
          `"${title}" kitabını silmek üzeresin.\n\n` +
            "Bu kitaba bağlı TÜM karakterler, mekanlar ve alıntılar da " +
            "kalıcı olarak silinecek. Bu işlem geri alınamaz.\n\nDevam edilsin mi?",
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        idleLabel="Sil"
        pendingLabel="Siliniyor…"
        className={buttonClass({ variant: "danger", size: "sm" })}
      />
    </form>
  );
}
