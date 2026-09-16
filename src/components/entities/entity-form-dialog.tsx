"use client";

import { useRef, useState, useTransition } from "react";
import { createEntity, updateEntity } from "@/app/actions/entities";
import { ENTITY_LABELS, type Entity, type EntityKind } from "@/lib/entities";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal, ModalActions } from "@/components/ui/modal";

// label.singular küçük harfle saklanır ("karakter"); başlıkta cümle başı olur.
// Türkçe locale'i şart: "i" -> "İ".
function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("tr") + value.slice(1);
}

// Karakter/mekan kartı ekleme VE düzenleme modalı (mode ile). Görsel dosya
// olarak yüklenir (/api/upload-image) ve dönen kalıcı Storage URL'i
// create/updateEntity'ye geçer. Düzenlemede yeni dosya seçilmezse mevcut
// görsel korunur.
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function openDialog() {
    setError(null);
    setFileName(null);
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    const values = new FormData(formEl);

    startTransition(async () => {
      // imageUrl boş kalırsa: create'te görselsiz, edit'te mevcut görsel korunur.
      let imageUrl = "";

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

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={openDialog}
          aria-label={`${entity?.name ?? label.singular} düzenle`}
          className={buttonClass({ variant: "ghost", size: "sm" })}
        >
          Düzenle
        </button>
      ) : (
        <button type="button" onClick={openDialog} className={buttonClass()}>
          {label.addCta}
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        heading={`${capitalize(label.singular)} ${isEdit ? "düzenle" : "ekle"}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="İsim" required>
            <Input
              name="name"
              required
              defaultValue={entity?.name ?? ""}
              placeholder={label.namePlaceholder}
            />
          </Field>

          <Field label="Betimleme">
            <Textarea
              name="description"
              rows={3}
              defaultValue={entity?.description ?? ""}
              placeholder={label.descriptionPlaceholder}
            />
          </Field>

          <Field label="Etiketler">
            <Input
              name="tags"
              defaultValue={entity?.tags?.join(", ") ?? ""}
              placeholder={label.tagsPlaceholder}
            />
          </Field>

          {/* Görsel kaynağı seçimi */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink">Görsel</span>

            {isEdit && entity?.image_url && (
              <div className="flex items-center gap-3 rounded-lg border border-line p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- mevcut görsel önizlemesi */}
                <img
                  src={entity.image_url}
                  alt="Mevcut görsel"
                  className="h-12 w-12 shrink-0 rounded object-cover"
                />
                <span className="text-xs text-ink-subtle">
                  Mevcut görsel. Değiştirmek için yeni dosya seç; dokunmazsan
                  korunur.
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Gizli input FormData için "file" adıyla kalır;
                    davranış aynı, sadece tetikleyici şık bir buton. */}
              <input
                ref={fileInputRef}
                type="file"
                name="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={buttonClass({
                  variant: "secondary",
                  size: "sm",
                  className: "shrink-0",
                })}
              >
                Görsel Seç
              </button>
              <span className="min-w-0 flex-1 truncate text-xs text-ink-subtle">
                {fileName ?? "Dosya seçilmedi"}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <ModalActions>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClass({ variant: "secondary" })}
            >
              İptal
            </button>
            <button type="submit" disabled={pending} className={buttonClass()}>
              {pending ? "Kaydediliyor…" : isEdit ? "Kaydet" : "Ekle"}
            </button>
          </ModalActions>
        </form>
      </Modal>
    </>
  );
}
