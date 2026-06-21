"use client";

import { deleteQuote } from "@/app/actions/quotes";

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
      <button
        type="submit"
        aria-label="Alıntıyı sil"
        className="rounded-md px-2 py-0.5 text-xs font-medium text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
      >
        Sil
      </button>
    </form>
  );
}
