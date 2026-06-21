"use client";

import { deleteBook } from "@/app/actions/books";
import { SubmitButton } from "@/components/ui/submit-button";

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
        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
      />
    </form>
  );
}
