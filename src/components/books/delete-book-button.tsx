"use client";

import { deleteBook } from "@/app/actions/books";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Delete, with a confirmation dialog that spells out the cascade: characters,
// locations, quotes and images go with the book.
export function DeleteBookButton({
  id,
  title,
  open,
  onOpenChange,
}: {
  id: string;
  title: string;
  // When given, the component renders no button of its own and is opened from the ⋯ menu.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <ConfirmDialog
      triggerLabel={t.common.delete}
      triggerClassName={buttonClass({ variant: "danger", size: "sm" })}
      title={t.book.deleteTitle}
      body={t.book.deleteBody(title)}
      confirmLabel={t.common.delete}
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={async () => {
        const formData = new FormData();
        formData.set("id", id);
        await deleteBook(formData);
      }}
    />
  );
}
