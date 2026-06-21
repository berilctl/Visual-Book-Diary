"use client";

import { useState, useTransition } from "react";
import { createEntity } from "@/app/actions/entities";
import { ENTITY_LABELS, type EntityKind } from "@/lib/entities";

// Karakter/mekan kartı ekleme modalı. Akış (Adım 6 + 7):
//   1. Dosya seçildiyse önce /api/upload-image'e yükle -> kalıcı URL.
//   2. createEntity() ile satırı (image_url dahil) oluştur.
export function EntityFormDialog({
  kind,
  bookId,
}: {
  kind: EntityKind;
  bookId: string;
}) {
  const label = ENTITY_LABELS[kind];
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
    const formEl = event.currentTarget;
    const values = new FormData(formEl);
    const file = values.get("file");

    startTransition(async () => {
      let imageUrl = "";

      // 1. Görsel (opsiyonel) -> ortak upload pipeline.
      if (file instanceof File && file.size > 0) {
        const uploadData = new FormData();
        uploadData.set("book_id", bookId);
        uploadData.set("file", file);
        const res = await fetch("/api/upload-image", {
          method: "POST",
          body: uploadData,
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Görsel yüklenemedi.");
          return;
        }
        imageUrl = json.url;
      }

      // 2. Kartı oluştur.
      const createData = new FormData();
      createData.set("kind", kind);
      createData.set("book_id", bookId);
      createData.set("name", String(values.get("name") ?? ""));
      createData.set("description", String(values.get("description") ?? ""));
      createData.set("tags", String(values.get("tags") ?? ""));
      createData.set("image_url", imageUrl);

      const result = await createEntity(undefined, createData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {label.addCta}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold capitalize">
              {label.singular} ekle
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">İsim *</span>
                <input
                  name="name"
                  required
                  placeholder={
                    kind === "characters" ? "örn. Mina Harker" : "örn. Whitby"
                  }
                  className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Betimleme</span>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Görünüş, kişilik, atmosfer…"
                  className="resize-y rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Etiketler</span>
                <input
                  name="tags"
                  placeholder="virgülle ayır: Vampir, Antagonist"
                  className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">
                  Görsel (png / jpeg / webp, ≤ 5 MB)
                </span>
                <input
                  type="file"
                  name="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="text-sm"
                />
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
