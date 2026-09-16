"use client";

import { deleteEntity } from "@/app/actions/entities";
import type { EntityKind } from "@/lib/entities";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export function DeleteEntityButton({
  kind,
  bookId,
  id,
  name,
}: {
  kind: EntityKind;
  bookId: string;
  id: string;
  name: string;
}) {
  const { t } = useI18n();
  return (
    <form
      action={deleteEntity}
      onSubmit={(e) => {
        if (!window.confirm(t.entity.deleteConfirm(name))) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        idleLabel={t.common.delete}
        pendingLabel={t.common.deleting}
        ariaLabel={t.entity.deleteAria(name)}
        className={buttonClass({ variant: "dangerQuiet", size: "sm" })}
      />
    </form>
  );
}
