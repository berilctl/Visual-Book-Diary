"use client";

import { useState, useTransition } from "react";
import { createQuote } from "@/app/actions/quotes";
import { buttonClass } from "@/components/ui/button";
import { Field, Select, Textarea, Input } from "@/components/ui/field";
import { Modal, ModalActions } from "@/components/ui/modal";

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

  return (
    <>
      <button type="button" onClick={openDialog} className={buttonClass()}>
        + Alıntı Ekle
      </button>

      <Modal open={open} onClose={() => setOpen(false)} heading="Alıntı ekle">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="book_id" value={bookId} />

          <Field label="Alıntı" required>
            <Textarea
              name="content"
              required
              rows={4}
              placeholder="Alıntı metnini buraya yaz…"
            />
          </Field>

          <Field label="Sayfa / Bölüm">
            <Input
              name="page_or_chapter"
              placeholder="örn. s. 142 ya da Bölüm 7"
            />
          </Field>

          <Field
            label="Karakter (opsiyonel)"
            hint={
              characters.length === 0
                ? "Bu kitapta henüz karakter yok."
                : undefined
            }
          >
            <Select name="character_id" defaultValue="">
              <option value="">— karaktere bağlama</option>
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
              İptal
            </button>
            <button type="submit" disabled={pending} className={buttonClass()}>
              {pending ? "Kaydediliyor…" : "Ekle"}
            </button>
          </ModalActions>
        </form>
      </Modal>
    </>
  );
}
