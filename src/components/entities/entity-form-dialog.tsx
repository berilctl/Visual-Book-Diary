"use client";

import { useRef, useState, useTransition } from "react";
import { createEntity, updateEntity } from "@/app/actions/entities";
import type { Entity, EntityKind } from "@/lib/entities";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useControllableOpen } from "@/components/ui/use-controllable-open";

// Dialog for adding and editing a character or location card. The image is
// uploaded as a file (/api/upload-image) and the permanent Storage URL that
// comes back is passed to create/updateEntity. When editing, leaving the file
// input empty keeps the current image.
// Passing open/onOpenChange controls the dialog from the outside (the ⋯ menu)
// and hides its own trigger button.
export function EntityFormDialog({
  kind,
  bookId,
  mode = "create",
  entity,
  open: openProp,
  onOpenChange,
}: {
  kind: EntityKind;
  bookId: string;
  mode?: "create" | "edit";
  entity?: Entity;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const label = t.entityKinds[kind];
  const isEdit = mode === "edit";
  const [open, setOpen, controlled] = useControllableOpen(openProp, onOpenChange);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function openDialog() {
    setError(null);
    setFileName(null);
    setOpen(true);
  }

  // Reset on close as well: openDialog never runs when it is controlled from the outside.
  function closeDialog() {
    setOpen(false);
    setError(null);
    setFileName(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    const values = new FormData(formEl);

    startTransition(async () => {
      // An empty imageUrl means no image on create, and the current image kept on edit.
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
          setError(json.error ?? t.upload.failed);
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
        closeDialog();
      }
    });
  }

  return (
    <>
      {controlled ? null : isEdit ? (
        <button
          type="button"
          onClick={openDialog}
          aria-label={t.entity.editAria(entity?.name ?? label.editTitle)}
          className={buttonClass({ variant: "ghost", size: "sm" })}
        >
          {t.common.edit}
        </button>
      ) : (
        <button type="button" onClick={openDialog} className={buttonClass()}>
          {label.addCta}
        </button>
      )}

      <Modal
        open={open}
        onClose={closeDialog}
        heading={isEdit ? label.editTitle : label.addTitle}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label={t.entity.name} required>
            <Input
              name="name"
              required
              defaultValue={entity?.name ?? ""}
              placeholder={label.namePlaceholder}
            />
          </Field>

          <Field label={t.entity.description}>
            <Textarea
              name="description"
              rows={3}
              defaultValue={entity?.description ?? ""}
              placeholder={label.descriptionPlaceholder}
            />
          </Field>

          <Field label={t.entity.tags}>
            <Input
              name="tags"
              defaultValue={entity?.tags?.join(", ") ?? ""}
              placeholder={label.tagsPlaceholder}
            />
          </Field>

          {/* Image source */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink">
              {t.entity.image}
            </span>

            {isEdit && entity?.image_url && (
              <div className="flex items-center gap-3 rounded-lg border border-line p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- preview of the current image */}
                <img
                  src={entity.image_url}
                  alt={t.entity.currentImageAlt}
                  className="h-12 w-12 shrink-0 rounded object-cover"
                />
                <span className="text-xs text-ink-subtle">
                  {t.entity.currentImageHint}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* The hidden input keeps the "file" name for FormData; only the
                    trigger is a styled button. */}
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
                {t.entity.chooseImage}
              </button>
              <span className="min-w-0 flex-1 truncate text-xs text-ink-subtle">
                {fileName ?? t.entity.noFileChosen}
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
              onClick={closeDialog}
              className={buttonClass({ variant: "secondary" })}
            >
              {t.common.cancel}
            </button>
            <button type="submit" disabled={pending} className={buttonClass()}>
              {pending ? t.common.saving : isEdit ? t.common.save : t.common.add}
            </button>
          </ModalActions>
        </form>
      </Modal>
    </>
  );
}
