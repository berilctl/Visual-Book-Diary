"use client";

import { useState, useTransition } from "react";
import { createQuote } from "@/app/actions/quotes";

// Alıntı ekleme modalı: content (zorunlu), page_or_chapter (opsiyonel),
// ve opsiyonel karakter bağlama (bu kitabın karakterleri arasından).
export function QuoteFormDialog({
  bookId,
  characters,
}: {
  bookId: string;
  characters: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openDialog() {
    setError(null);
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createQuote(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  const inputClass =
    "rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40";

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        + Alıntı Ekle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold">Alıntı ekle</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input type="hidden" name="book_id" value={bookId} />

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Alıntı *</span>
                <textarea
                  name="content"
                  required
                  rows={4}
                  placeholder="Alıntı metnini buraya yaz…"
                  className={`resize-y ${inputClass}`}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Sayfa / Bölüm</span>
                <input
                  name="page_or_chapter"
                  placeholder="örn. s. 142 ya da Bölüm 7"
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Karakter (opsiyonel)</span>
                <select name="character_id" defaultValue="" className={inputClass}>
                  <option value="">— karaktere bağlama</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {characters.length === 0 && (
                  <span className="text-xs text-black/45 dark:text-white/45">
                    Bu kitapta henüz karakter yok.
                  </span>
                )}
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
                  {pending ? "Kaydediliyor…" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
