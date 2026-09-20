"use client";

import { useOptimistic, useState, useTransition } from "react";
import { finishBook, rateBook } from "@/app/actions/books";
import { FINISHABLE_STATUSES, type Book } from "@/lib/books";
import { formatDate, localISODate } from "@/lib/format";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { Modal, ModalActions } from "@/components/ui/modal";
import { StarRating } from "@/components/ui/star-rating";

// The confetti bursts from wherever the button sits on screen. The library is
// loaded on the first celebration only, so it stays out of the initial page
// load. Colours are read from the theme tokens and work in both themes. With
// "reduce motion" enabled it never plays.
async function celebrate(from: HTMLElement) {
  const { default: confetti } = await import("canvas-confetti");
  const rect = from.getBoundingClientRect();
  const origin = {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  };
  const styles = getComputedStyle(document.documentElement);
  const colors = ["--accent", "--gold", "--success"]
    .map((name) => styles.getPropertyValue(name).trim())
    .filter(Boolean);

  const shared = { origin, colors, disableForReducedMotion: true };
  confetti({ ...shared, particleCount: 80, spread: 70, startVelocity: 40 });
  // A second, wider and slower wave.
  setTimeout(() => {
    confetti({ ...shared, particleCount: 50, spread: 110, startVelocity: 28, scalar: 0.9 });
  }, 180);
}

// A book's reading progress: the finish button, the rating and the finish date.
//
// The rating dialog's state lives here rather than inside the button: once the
// book is finished the page re-renders with status "completed" and the finish
// button leaves the DOM. A dialog inside it would go with it; this component
// renders in every status, so it stays.
export function BookProgress({
  book,
  variant,
}: {
  book: Book;
  variant: "card" | "hero";
}) {
  const { t, intlLocale } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<number | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Stars on the detail page fill immediately on click and fall back to the
  // previous value if the save fails.
  const [shownRating, setShownRating] = useOptimistic(book.rating ?? null);

  const finishable = FINISHABLE_STATUSES.includes(book.status);
  const completed = book.status === "completed";

  function handleFinish(event: React.MouseEvent<HTMLButtonElement>) {
    const button = event.currentTarget;
    setError(null);
    const formData = new FormData();
    formData.set("id", book.id);
    formData.set("today", localISODate());

    startTransition(async () => {
      const result = await finishBook(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      void celebrate(button);
      setDraft(null);
      setDialogError(null);
      setDialogOpen(true);
    });
  }

  function saveRating(value: number, onError: (message: string) => void) {
    const formData = new FormData();
    formData.set("id", book.id);
    formData.set("rating", String(value));
    return rateBook(undefined, formData).then((result) => {
      if (result?.error) onError(result.error);
      return !result?.error;
    });
  }

  function handleInlineRate(value: number) {
    setError(null);
    startTransition(async () => {
      setShownRating(value);
      await saveRating(value, setError);
    });
  }

  function handleDialogSave() {
    if (!draft) return;
    setDialogError(null);
    startTransition(async () => {
      const ok = await saveRating(draft, setDialogError);
      if (ok) setDialogOpen(false);
    });
  }

  const finishedOn = completed
    ? formatDate(book.finished_at ?? null, intlLocale)
    : null;

  return (
    <>
      {finishable && (
        <button
          type="button"
          onClick={handleFinish}
          disabled={pending}
          className={buttonClass(
            variant === "card"
              ? { variant: "secondary", size: "sm", className: "w-full" }
              : { variant: "primary" },
          )}
        >
          <CheckIcon className={variant === "card" ? "size-4" : "size-5"} />
          {pending ? t.common.saving : t.finish.cta}
        </button>
      )}

      {completed && variant === "card" && book.rating && (
        <StarRating value={book.rating} size="sm" />
      )}

      {completed && variant === "hero" && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StarRating
            value={shownRating}
            onChange={handleInlineRate}
            disabled={pending}
          />
          {finishedOn && (
            <span className="text-sm text-ink-subtle">
              {t.finish.finishedOn(finishedOn)}
            </span>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        heading={t.finish.celebrateTitle}
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          {t.finish.celebrateLead(book.title)}
        </p>

        <div className="my-6 flex justify-center">
          <StarRating
            value={draft}
            onChange={setDraft}
            size="lg"
            disabled={pending}
          />
        </div>

        {dialogError && (
          <p className="mb-2 text-sm text-danger" role="alert">
            {dialogError}
          </p>
        )}

        <ModalActions>
          <button
            type="button"
            onClick={() => setDialogOpen(false)}
            className={buttonClass({ variant: "secondary" })}
          >
            {t.finish.later}
          </button>
          <button
            type="button"
            onClick={handleDialogSave}
            disabled={!draft || pending}
            className={buttonClass()}
          >
            {pending ? t.common.saving : t.finish.saveRating}
          </button>
        </ModalActions>
      </Modal>
    </>
  );
}
