"use client";

import { deleteEntity } from "@/app/actions/entities";
import type { EntityKind } from "@/lib/entities";

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
      <button
        type="submit"
        aria-label={`${name} sil`}
        className="rounded-md px-2 py-0.5 text-xs font-medium text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
      >
        Sil
      </button>
    </form>
  );
}
