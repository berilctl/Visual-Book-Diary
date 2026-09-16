"use client";

import { useState, useTransition } from "react";
import type { BookFormState } from "@/app/actions/books";
import { BOOK_STATUSES } from "@/lib/books";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass, type ButtonVariant } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal, ModalActions } from "@/components/ui/modal";

type Action = (
  prev: BookFormState,
  formData: FormData,
) => Promise<BookFormState>;

type Props = {
  action: Action;
  heading: string;
  submitLabel: string;
  triggerLabel: string;
  triggerVariant?: ButtonVariant;
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
  triggerVariant = "primary",
  bookId,
  initial,
}: Props) {
  const { t } = useI18n();
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

      <Modal open={open} onClose={() => setOpen(false)} heading={heading}>
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
            <Select name="status" defaultValue={initial?.status ?? "reading"}>
              {BOOK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.bookStatus[s]}
                </option>
              ))}
            </Select>
          </Field>

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
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={pending}
              className={buttonClass()}
            >
              {pending ? t.common.saving : submitLabel}
            </button>
          </ModalActions>
        </form>
      </Modal>
    </>
  );
}
