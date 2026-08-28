"use client";

import { deleteEntity } from "@/app/actions/entities";
import type { EntityKind } from "@/lib/entities";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClass } from "@/components/ui/button";

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
  return (
    <form
      action={deleteEntity}
      onSubmit={(e) => {
        if (!window.confirm(`"${name}" silinsin mi? Bu işlem geri alınamaz.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        idleLabel="Sil"
        pendingLabel="Siliniyor…"
        ariaLabel={`${name} sil`}
        className={buttonClass({ variant: "dangerQuiet", size: "sm" })}
      />
    </form>
  );
}
