"use client";

import { useState, useTransition } from "react";
import { createQuote } from "@/app/actions/quotes";
import { buttonClass } from "@/components/ui/button";
import { Field, Select, Textarea, Input } from "@/components/ui/field";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useI18n } from "@/components/i18n-provider";

// Dialog for adding a quote: content (required), page_or_chapter (optional)
// and an optional link to one of this book's characters.
export function QuoteFormDialog({
  bookId,
  characters,
}: {
  bookId: string;
  characters: { id: string; name: string }[];
}) {
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

  return (
    <>
      <button type="button" onClick={openDialog} className={buttonClass()}>
        {t.quotes.addCta}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} heading={t.quotes.addTitle}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="book_id" value={bookId} />

          <Field label={t.quotes.content} required>
            <Textarea
              name="content"
              required
              rows={4}
              placeholder={t.quotes.contentPlaceholder}
            />
          </Field>

          <Field label={t.quotes.pageOrChapter}>
            <Input
              name="page_or_chapter"
              placeholder={t.quotes.pageOrChapterPlaceholder}
            />
          </Field>

          <Field
            label={t.quotes.character}
            hint={
              characters.length === 0
                ? t.quotes.noCharactersHint
                : undefined
            }
          >
            <Select name="character_id" defaultValue="">
              <option value="">{t.quotes.noCharacterOption}</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
            <button type="submit" disabled={pending} className={buttonClass()}>
              {pending ? t.common.saving : t.common.add}
            </button>
          </ModalActions>
        </form>
      </Modal>
    </>
  );
}
