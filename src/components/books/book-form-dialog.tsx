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
  // Kendi tetikleyici butonu için; open verilirse (dışarıdan kontrol) çizilmez.
  triggerLabel?: string;
  triggerVariant?: ButtonVariant;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Verilirse düzenleme modu:
  bookId?: string;
  initial?: {
    title?: string;
    author?: string;
    start_date?: string | null;
    status?: string;
    cover_url?: string | null;
  };
};

// Kitap ekleme VE düzenleme için ortak modal + form (bookId varsa düzenleme).
//
// Kapak akışı: yükleme hattı görseli var olan bir kitabın klasörüne yazdığı
// için ekleme sırası "kitabı oluştur -> kapağı yükle -> kitaba bağla".
// Kitap oluşup kapak yüklemesi başarısız olursa kitap zaten kaydedilmiştir;
// kullanıcı tekrar "Ekle"ye basarsa ikinci bir kitap açılmasın diye oluşan
// kitabın kimliği (createdId) saklanır ve sonraki deneme onu günceller.
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

  // Kapak seçimi. previewUrl bir object URL; ref kopyası, bileşen kaldırılırken
  // serbest bırakmak için (efekt içinde state okunmaz/yazılmaz).
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);

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
    resetCover();
    setOpen(true);
  }

  // Sıfırlama kapanışta: dışarıdan kontrolde (⋯ menüsü) openDialog hiç
  // çalışmaz, bir sonraki açılış yine temiz başlasın.
  function closeDialog() {
    setOpen(false);
    setError(null);
    setCreatedId(null);
    resetCover();
  }

  function problemMessage(problem: ImageFileProblem) {
    if (problem === "type") return t.upload.badType;
    if (problem === "empty") return t.upload.emptyFile;
    return t.upload.tooLarge(IMAGE_MAX_MB);
  }

  // Tip/boyut kitap oluşturulmadan ÖNCE kontrol edilir: en sık hatalar
  // yakalanır ve "kitap eklendi ama kapak yok" durumu çoğunlukla hiç oluşmaz.
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

  // Yeni seçilen dosya varsa onu geri alır (mevcut kapak geri görünür);
  // yoksa mevcut kapağı kaldırılacak olarak işaretler.
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
    // Elle "Tamamlandı" seçilirse bitiş günü kullanıcının yerel günü olsun.
    formData.set("today", localISODate());

    // Dosya baytları Server Action'a gönderilmez; ayrı upload rotasına gider.
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

      // 1. Ekleme: kitabı oluştur (önceki denemede oluşmadıysa).
      if (!id) {
        const created = await createBook(undefined, formData);
        if (created?.error || !created?.id) {
          setError(created?.error ?? t.errors.serviceUnavailable);
          return;
        }
        id = created.id;
        setCreatedId(id);
      }

      // 2. Kapak seçildiyse yükle.
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
          // Ağ hatası: genel mesaj kalır.
        }
        if (!coverUrl) {
          setError(bookId ? message : t.book.coverFailedBookSaved);
          return;
        }
      }

      // 3. Düzenleme; ya da kapak eklenecek/kaldırılacak; ya da önceki denemede
      //    oluşan kitaba form değişiklikleri uygulanacak.
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

      // Başarılı: revalidatePath sayfaları tazeler, modalı kapat.
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
            <Select name="status" defaultValue={initial?.status ?? "reading"}>
              {BOOK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.bookStatus[s]}
                </option>
              ))}
            </Select>
          </Field>

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
