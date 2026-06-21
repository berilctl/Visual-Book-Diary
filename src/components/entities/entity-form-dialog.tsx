"use client";

import { useState, useTransition } from "react";
import { createEntity } from "@/app/actions/entities";
import { ENTITY_LABELS, type EntityKind } from "@/lib/entities";

type ImageMode = "upload" | "ai";

// Karakter/mekan kartı ekleme modalı. Görsel iki yolla eklenebilir:
//   (a) Dosya yükle -> /api/upload-image
//   (b) AI ile üret -> /api/generate-image (Replicate'in byte'ları Storage'a
//       re-host edilir, kalıcı URL döner)
// Her iki yolda da kalıcı Storage URL'i createEntity'ye geçer.
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

  // Görsel kaynağı durumu.
  const [imageMode, setImageMode] = useState<ImageMode>("upload");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiUrl, setAiUrl] = useState<string | null>(null);

  function openDialog() {
    setError(null);
    setImageMode("upload");
    setPrompt("");
    setAiUrl(null);
    setOpen(true);
  }

  // AI üretimi — kendi loading state'i ("Görsel üretiliyor…").
  async function handleGenerate() {
    setError(null);
    if (!prompt.trim()) {
      setError("Görsel için bir betimleme yaz.");
      return;
    }
    setGenerating(true);
    setAiUrl(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: bookId, prompt: prompt.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Görsel üretilemedi.");
      } else {
        setAiUrl(json.url);
      }
    } catch {
      setError("İstek gönderilemedi.");
    } finally {
      setGenerating(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    const values = new FormData(formEl);

    startTransition(async () => {
      let imageUrl = "";

      if (imageMode === "upload") {
        const file = values.get("file");
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
      } else {
        // AI modunda görselin üretilmiş olması gerekir.
        if (!aiUrl) {
          setError("Önce 'Görsel Üret' ile bir görsel oluştur.");
          return;
        }
        imageUrl = aiUrl;
      }

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

  const inputClass =
    "rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40";

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
          <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900">
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
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Betimleme</span>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Görünüş, kişilik, atmosfer…"
                  className={`resize-y ${inputClass}`}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Etiketler</span>
                <input
                  name="tags"
                  placeholder="virgülle ayır: Vampir, Antagonist"
                  className={inputClass}
                />
              </label>

              {/* Görsel kaynağı seçimi */}
              <div className="mt-1 flex flex-col gap-2">
                <span className="text-sm font-medium">Görsel</span>
                <div className="flex gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setImageMode("upload");
                      setError(null);
                    }}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      imageMode === "upload"
                        ? "bg-white shadow-sm dark:bg-neutral-800"
                        : "opacity-60"
                    }`}
                  >
                    Dosya Yükle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageMode("ai");
                      setError(null);
                    }}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      imageMode === "ai"
                        ? "bg-white shadow-sm dark:bg-neutral-800"
                        : "opacity-60"
                    }`}
                  >
                    AI ile Üret
                  </button>
                </div>

                {imageMode === "upload" ? (
                  <input
                    type="file"
                    name="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="text-sm"
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={2}
                      placeholder="örn. solgun tenli, kızıl gözlü bir vampir, gotik portre"
                      className={`resize-y ${inputClass}`}
                    />
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="self-start rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium transition hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5"
                    >
                      {generating ? "Görsel üretiliyor…" : "Görsel Üret"}
                    </button>

                    {generating && (
                      <p className="text-xs text-black/55 dark:text-white/55">
                        Bu işlem birkaç saniye sürebilir…
                      </p>
                    )}

                    {aiUrl && !generating && (
                      // eslint-disable-next-line @next/next/no-img-element -- üretilen görselin önizlemesi
                      <img
                        src={aiUrl}
                        alt="Üretilen görsel önizlemesi"
                        className="mt-1 h-40 w-full rounded-lg border border-black/10 object-cover dark:border-white/10"
                      />
                    )}
                  </div>
                )}
              </div>

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
                  disabled={pending || generating}
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
