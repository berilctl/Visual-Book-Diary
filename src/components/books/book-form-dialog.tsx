"use client";

import { useState, useTransition } from "react";
import type { BookFormState } from "@/app/actions/books";
import { BOOK_STATUSES, BOOK_STATUS_LABELS } from "@/lib/books";

type Action = (
  prev: BookFormState,
  formData: FormData,
) => Promise<BookFormState>;

type Props = {
  action: Action;
  heading: string;
  submitLabel: string;
  triggerLabel: string;
  triggerClassName?: string;
  // Düzenleme modu için:
  bookId?: string;
  initial?: {
    title?: string;
    author?: string;
    start_date?: string | null;
    status?: string;
  };
};

// Kitap ekleme VE düzenleme için ortak modal + form. Server Action'ı bir
// event handler içinde çağırır; hata varsa gösterir, başarıda modalı kapatır.
export function BookFormDialog({
  action,
  heading,
  submitLabel,
  triggerLabel,
  triggerClassName,
  bookId,
  initial,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openDialog() {
    setError(null);
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        // Başarılı: revalidatePath dashboard'u tazeler, modalı kapat.
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={openDialog}>
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold">{heading}</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {bookId && <input type="hidden" name="id" value={bookId} />}

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Kitap adı *</span>
                <input
                  name="title"
                  required
                  defaultValue={initial?.title ?? ""}
                  placeholder="örn. Dracula"
                  className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Yazar *</span>
                <input
                  name="author"
                  required
                  defaultValue={initial?.author ?? ""}
                  placeholder="örn. Bram Stoker"
                  className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Başlangıç tarihi</span>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={initial?.start_date ?? ""}
                  className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Durum</span>
                <select
                  name="status"
                  defaultValue={initial?.status ?? "reading"}
                  className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40 dark:bg-neutral-900"
                >
                  {BOOK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {BOOK_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {pending ? "Kaydediliyor…" : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
