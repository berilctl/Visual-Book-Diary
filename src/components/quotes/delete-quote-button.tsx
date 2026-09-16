"use client";

import { deleteQuote } from "@/app/actions/quotes";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const EXCERPT_LENGTH = 90;

// Pencerede alıntının başı gösterilir: aynı sayfada birden çok alıntı varken
// hangisinin silineceği belli olsun.
function excerpt(text: string) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > EXCERPT_LENGTH
    ? `${flat.slice(0, EXCERPT_LENGTH).trimEnd()}…`
    : flat;
}

export function DeleteQuoteButton({
  id,
  bookId,
  content,
}: {
  id: string;
  bookId: string;
  content: string;
}) {
  const { t } = useI18n();

  return (
    <ConfirmDialog
      triggerLabel={t.common.delete}
      triggerAriaLabel={t.quotes.deleteAria}
      triggerClassName={buttonClass({ variant: "dangerQuiet", size: "sm" })}
      title={t.quotes.deleteTitle}
      body={t.quotes.deleteBody(excerpt(content))}
      confirmLabel={t.common.delete}
      onConfirm={async () => {
        const formData = new FormData();
        formData.set("id", id);
        formData.set("book_id", bookId);
        await deleteQuote(formData);
      }}
    />
  );
}
