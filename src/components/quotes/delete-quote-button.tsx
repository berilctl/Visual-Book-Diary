"use client";

import { deleteQuote } from "@/app/actions/quotes";
import { SubmitButton } from "@/components/ui/submit-button";

export function DeleteQuoteButton({
  id,
  bookId,
}: {
  id: string;
  bookId: string;
}) {
  return (
    <form
      action={deleteQuote}
      onSubmit={(e) => {
        if (!window.confirm("Bu alıntı silinsin mi? Bu işlem geri alınamaz.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="book_id" value={bookId} />
      <SubmitButton
        idleLabel="Sil"
        pendingLabel="Siliniyor…"
        ariaLabel="Alıntıyı sil"
        className="rounded-md px-2 py-0.5 text-xs font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
      />
    </form>
  );
}
