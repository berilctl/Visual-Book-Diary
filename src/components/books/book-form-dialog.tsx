"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createBook, updateBook } from "@/app/actions/books";
import { BOOK_STATUSES } from "@/lib/books";
import { localISODate } from "@/lib/format";
import {
  IMAGE_ACCEPT,
  IMAGE_MAX_MB,
  imageFileProblem,
  type ImageFileProblem,
} from "@/lib/storage/limits";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass, type ButtonVariant } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useControllableOpen } from "@/components/ui/use-controllable-open";
import { BookCover } from "./book-cover";

type Props = {
  heading: string;
  submitLabel: string;
  // For the component's own trigger button; not rendered when `open` is passed in.
  triggerLabel?: string;
  triggerVariant?: ButtonVariant;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // When given, the dialog is in edit mode:
  bookId?: string;
  initial?: {
    title?: string;
    author?: string;
    start_date?: string | null;
    status?: string;
    finished_at?: string | null;
    cover_url?: string | null;
  };
};

// The shared dialog and form for adding AND editing a book (bookId means edit).
//
// Cover flow: the upload pipeline writes into an existing book's folder, so
// adding goes "create the book -> upload the cover -> link it to the book".
// If the book is created but the cover upload fails, the book is already
// saved; the new book's id (createdId) is kept so that pressing "Add" again
// updates that book instead of creating a second one.
export function BookFormDialog({
  heading,
  submitLabel,
  triggerLabel,
  triggerVariant = "primary",
  bookId,
  initial,
  open: openProp,
  onOpenChange,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen, controlled] = useControllableOpen(openProp, onOpenChange);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Cover selection. previewUrl is an object URL; the ref copy is what the
  // cleanup on unmount revokes (an effect must not read or write state here).
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);

  // Selected status: the finish date field is only shown for "completed".
  // Only the user's own change is tracked (null = untouched -> the book's
  // CURRENT value). Copying the status into state and resetting it on close
  // would be wrong: after a save the close handler still sees the old prop and
  // the next open would show the previous status.
  const [statusChoice, setStatusChoice] = useState<string | null>(null);
  const initialStatus = initial?.status ?? "reading";
  const status = statusChoice ?? initialStatus;

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function replacePreview(next: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreviewUrl(next);
  }

  function resetCover() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    replacePreview(null);
    setFileName(null);
    setRemoveCover(false);
  }

  function openDialog() {
    setError(null);
    setCreatedId(null);
    setStatusChoice(null);
    resetCover();
    setOpen(true);
  }

  // Reset on close, because when the dialog is controlled from the outside
  // (the ⋯ menu) openDialog never runs and the next open has to start clean.
  function closeDialog() {
    setOpen(false);
    setError(null);
    setCreatedId(null);
    setStatusChoice(null);
    resetCover();
  }

  function problemMessage(problem: ImageFileProblem) {
    if (problem === "type") return t.upload.badType;
    if (problem === "empty") return t.upload.emptyFile;
    return t.upload.tooLarge(IMAGE_MAX_MB);
  }

  // Type and size are checked BEFORE the book is created, so the common
  // mistakes are caught and "book added but no cover" mostly never happens.
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    if (!file) return;

    const problem = imageFileProblem(file);
    if (problem) {
      event.target.value = "";
      setError(problemMessage(problem));
      return;
    }
    replacePreview(URL.createObjectURL(file));
    setFileName(file.name);
    setRemoveCover(false);
  }

  // With a newly picked file this undoes the choice (the current cover comes
  // back); otherwise it marks the existing cover for removal.
  function handleRemoveCover() {
    if (previewUrl) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      replacePreview(null);
      setFileName(null);
    } else {
      setRemoveCover(true);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    // File bytes never go to a Server Action; they go to the upload route.
    const file = formData.get("cover");
    formData.delete("cover");
    const coverFile = file instanceof File && file.size > 0 ? file : null;

    startTransition(async () => {
      if (coverFile) {
        const problem = imageFileProblem(coverFile);
        if (problem) {
          setError(problemMessage(problem));
          return;
        }
      }

      const retryAfterCreate = !bookId && createdId !== null;
      let id = bookId ?? createdId;

      // 1. Adding: create the book, unless a previous attempt already did.
      if (!id) {
        const created = await createBook(undefined, formData);
        if (created?.error || !created?.id) {
          setError(created?.error ?? t.errors.serviceUnavailable);
          return;
        }
        id = created.id;
        setCreatedId(id);
      }

      // 2. Upload the cover, if one was picked.
      let coverUrl = "";
      if (coverFile) {
        const upload = new FormData();
        upload.set("book_id", id);
        upload.set("file", coverFile);
        let message: string = t.upload.failed;
        try {
          const res = await fetch("/api/upload-image", {
            method: "POST",
            body: upload,
          });
          const json = await res.json();
          if (res.ok) coverUrl = json.url;
          else if (json.error) message = json.error;
        } catch {
          // Network error: the generic message stands.
        }
        if (!coverUrl) {
          setError(bookId ? message : t.book.coverFailedBookSaved);
          return;
        }
      }

      // 3. Editing; or attaching/removing a cover; or applying the form
      //    changes to the book a previous attempt created.
      if (bookId || coverUrl || retryAfterCreate) {
        formData.set("id", id);
        if (coverUrl) formData.set("cover_url", coverUrl);
        else if (removeCover) formData.set("remove_cover", "1");

        const updated = await updateBook(undefined, formData);
        if (updated?.error) {
          setError(updated.error);
          return;
        }
      }

      // Success: revalidatePath refreshes the pages, so close the dialog.
      closeDialog();
    });
  }

  const shownCover =
    previewUrl ?? (removeCover ? null : (initial?.cover_url ?? null));

  return (
    <>
      {!controlled && (
        <button
          type="button"
          className={buttonClass({
            variant: triggerVariant,
            size: triggerVariant === "primary" ? "md" : "sm",
          })}
          onClick={openDialog}
        >
          {triggerLabel}
        </button>
      )}

      <Modal open={open} onClose={closeDialog} heading={heading}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {bookId && <input type="hidden" name="id" value={bookId} />}

          <Field label={t.book.title} required>
            <Input
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              placeholder={t.book.titlePlaceholder}
            />
          </Field>

          <Field label={t.book.author} required>
            <Input
              name="author"
              required
              defaultValue={initial?.author ?? ""}
              placeholder={t.book.authorPlaceholder}
            />
          </Field>

          <Field label={t.book.startDate}>
            <Input
              type="date"
              name="start_date"
              defaultValue={initial?.start_date ?? ""}
            />
          </Field>

          <Field label={t.book.status}>
            <Select
              name="status"
              defaultValue={initialStatus}
              onChange={(event) => setStatusChoice(event.target.value)}
            >
              {BOOK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.bookStatus[s]}
                </option>
              ))}
            </Select>
          </Field>

          {status === "completed" && (
            <Field label={t.book.finishedAt} hint={t.book.finishedAtHint}>
              <Input
                type="date"
                name="finished_at"
                max={localISODate()}
                // Today when the status just moved to "completed", and empty
                // for a book that is already finished without a date — writing
                // "today" onto a book finished months ago would be wrong.
                defaultValue={
                  initial?.finished_at ??
                  (initialStatus === "completed" ? "" : localISODate())
                }
              />
            </Field>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">{t.book.cover}</span>
            <div className="flex items-center gap-4">
              <BookCover
                seed={bookId ?? "new"}
                coverUrl={shownCover}
                size="thumb"
                className="w-16 shrink-0 rounded-md border border-line"
              />
              <div className="flex min-w-0 flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  name="cover"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={buttonClass({ variant: "secondary", size: "sm" })}
                  >
                    {shownCover ? t.book.changeCover : t.book.chooseCover}
                  </button>
                  {shownCover && (
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className={buttonClass({
                        variant: "dangerQuiet",
                        size: "sm",
                      })}
                    >
                      {t.book.removeCover}
                    </button>
                  )}
                </div>
                <span className="truncate text-xs text-ink-subtle">
                  {fileName ?? t.book.coverHint(IMAGE_MAX_MB)}
                </span>
              </div>
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
              {pending ? t.common.saving : submitLabel}
            </button>
          </ModalActions>
        </form>
      </Modal>
    </>
  );
}
