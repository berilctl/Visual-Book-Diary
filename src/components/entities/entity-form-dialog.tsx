"use client";

import { useRef, useState, useTransition } from "react";
import { createEntity, updateEntity } from "@/app/actions/entities";
import { ENTITY_LABELS, type Entity, type EntityKind } from "@/lib/entities";

type ImageMode = "upload" | "ai";

// Karakter/mekan kartı ekleme VE düzenleme modalı (mode ile). Görsel iki yolla
// eklenir/değiştirilir:
//   (a) Dosya yükle -> /api/upload-image
//   (b) AI ile üret -> /api/generate-image (Replicate byte'ları Storage'a
//       re-host edilir, kalıcı URL döner)
// Her iki yolda da kalıcı Storage URL'i create/updateEntity'ye geçer.
// Düzenlemede görsel değiştirilmezse mevcut görsel korunur.
export function EntityFormDialog({
  kind,
  bookId,
  mode = "create",
  entity,
}: {
  kind: EntityKind;
  bookId: string;
  mode?: "create" | "edit";
  entity?: Entity;
}) {
  const label = ENTITY_LABELS[kind];
  const isEdit = mode === "edit";
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Görsel kaynağı durumu.
  const [imageMode, setImageMode] = useState<ImageMode>("upload");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiUrl, setAiUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function openDialog() {
    setError(null);
    setImageMode("upload");
    setPrompt("");
    setAiUrl(null);
    setFileName(null);
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
      // imageUrl boş kalırsa: create'te görselsiz, edit'te mevcut görsel korunur.
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
        // AI modu: üretilmiş bir görsel varsa kullan.
        if (aiUrl) {
          imageUrl = aiUrl;
        } else if (!isEdit) {
          // Ekleme akışında AI sekmesi seçiliyse görsel üretilmiş olmalı.
          setError("Önce 'Görsel Üret' ile bir görsel oluştur.");
          return;
        }
        // Düzenlemede üretilmemişse mevcut görsel korunur (imageUrl boş kalır).
      }

      const data = new FormData();
      data.set("kind", kind);
      data.set("book_id", bookId);
      data.set("name", String(values.get("name") ?? ""));
      data.set("description", String(values.get("description") ?? ""));
      data.set("tags", String(values.get("tags") ?? ""));
      data.set("image_url", imageUrl);

      let result;
      if (isEdit && entity) {
        data.set("id", entity.id);
        result = await updateEntity(undefined, data);
      } else {
        result = await createEntity(undefined, data);
      }

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
      {isEdit ? (
        <button
          type="button"
          onClick={openDialog}
          aria-label={`${entity?.name ?? label.singular} düzenle`}
          className="rounded-md px-2 py-0.5 text-xs font-medium text-black/70 transition hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
        >
          Düzenle
        </button>
      ) : (
        <button
          type="button"
          onClick={openDialog}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {label.addCta}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold capitalize">
              {label.singular} {isEdit ? "düzenle" : "ekle"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">İsim *</span>
                <input
                  name="name"
                  required
                  defaultValue={entity?.name ?? ""}
                  placeholder={label.namePlaceholder}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Betimleme</span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={entity?.description ?? ""}
                  placeholder={label.descriptionPlaceholder}
                  className={`resize-y ${inputClass}`}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Etiketler</span>
                <input
                  name="tags"
                  defaultValue={entity?.tags?.join(", ") ?? ""}
                  placeholder={label.tagsPlaceholder}
                  className={inputClass}
                />
              </label>

              {/* Görsel kaynağı seçimi */}
              <div className="mt-1 flex flex-col gap-2">
                <span className="text-sm font-medium">Görsel</span>

                {isEdit && entity?.image_url && (
                  <div className="flex items-center gap-3 rounded-lg border border-black/10 p-2 dark:border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element -- mevcut görsel önizlemesi */}
                    <img
                      src={entity.image_url}
                      alt="Mevcut görsel"
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                    <span className="text-xs text-black/55 dark:text-white/55">
                      Mevcut görsel. Değiştirmek için yeni dosya seç ya da AI ile
                      üret; dokunmazsan korunur.
                    </span>
                  </div>
                )}

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
                      setFileName(null);
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
                  <div className="flex items-center gap-3">
                    {/* Gizli input FormData için "file" adıyla kalır;
                        davranış aynı, sadece tetikleyici şık bir buton. */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        setFileName(e.target.files?.[0]?.name ?? null)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
                    >
                      Görsel Seç
                    </button>
                    <span className="min-w-0 flex-1 truncate text-xs text-black/55 dark:text-white/55">
                      {fileName ?? "Dosya seçilmedi"}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={2}
                      placeholder={label.promptPlaceholder}
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
                  {pending
                    ? "Kaydediliyor…"
                    : isEdit
                      ? "Kaydet"
                      : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
