"use client";

import Image from "next/image";
import { useState } from "react";

// Geçici test arayüzü — yalnızca /api/upload-image pipeline'ını tek başına
// denemek için. Adım 7'de gerçek karakter/mekan kartlarıyla değişecek.
export function UploadTestForm({
  books,
}: {
  books: { id: string; title: string }[];
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setUrl(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? `Hata (${res.status})`);
      } else {
        setUrl(json.url);
      }
    } catch {
      setError("İstek gönderilemedi.");
    } finally {
      setPending(false);
    }
  }

  if (books.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        Önce bir kitap ekle (kitaplıkta), sonra burada test edebilirsin.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Kitap (book_id)</span>
          <select
            name="book_id"
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/15 dark:bg-neutral-900"
          >
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Görsel (png / jpeg / webp, ≤ 5 MB)</span>
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {pending ? "Yükleniyor…" : "Yükle"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {url && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Yüklendi. Kalıcı URL:
          </p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-xs text-blue-600 underline dark:text-blue-400"
          >
            {url}
          </a>
          <Image
            src={url}
            alt="Yüklenen görsel"
            width={240}
            height={240}
            className="mt-2 rounded-lg border border-black/10 object-cover dark:border-white/10"
          />
        </div>
      )}
    </div>
  );
}
