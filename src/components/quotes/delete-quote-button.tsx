"use client";

import { deleteQuote } from "@/app/actions/quotes";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export function DeleteQuoteButton({
  id,
  bookId,
}: {
  id: string;
  bookId: string;
}) {
  const { t } = useI18n();
  return (
    <form
      action={deleteQuote}
      onSubmit={(e) => {
        if (!window.confirm(t.quotes.deleteConfirm)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="book_id" value={bookId} />
      <SubmitButton
        idleLabel={t.common.delete}
        pendingLabel={t.common.deleting}
        ariaLabel={t.quotes.deleteAria}
        className={buttonClass({ variant: "dangerQuiet", size: "sm" })}
      />
    </form>
  );
}
