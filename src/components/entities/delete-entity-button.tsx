"use client";

import { deleteEntity } from "@/app/actions/entities";
import type { EntityKind } from "@/lib/entities";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteEntityButton({
  kind,
  bookId,
  id,
  name,
  open,
  onOpenChange,
}: {
  kind: EntityKind;
  bookId: string;
  id: string;
  name: string;
  // Verilirse kendi butonu çizilmez, pencere dışarıdan (⋯ menüsü) açılır.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const label = t.entityKinds[kind];

  return (
    <ConfirmDialog
      triggerLabel={t.common.delete}
      triggerAriaLabel={t.entity.deleteAria(name)}
      triggerClassName={buttonClass({ variant: "dangerQuiet", size: "sm" })}
      title={label.deleteTitle}
      body={label.deleteBody(name)}
      confirmLabel={t.common.delete}
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={async () => {
        const formData = new FormData();
        formData.set("kind", kind);
        formData.set("book_id", bookId);
        formData.set("id", id);
        await deleteEntity(formData);
      }}
    />
  );
}
