"use client";

import { deleteQuote } from "@/app/actions/quotes";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClass } from "@/components/ui/button";

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
        className={buttonClass({ variant: "dangerQuiet", size: "sm" })}
      />
    </form>
  );
}
