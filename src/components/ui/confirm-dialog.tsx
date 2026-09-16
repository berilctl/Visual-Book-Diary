"use client";

import { useTransition, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useControllableOpen } from "@/components/ui/use-controllable-open";

// Geri alınamaz işlemler için onay: tetikleyici buton + temaya uygun pencere.
// Tarayıcının window.confirm() penceresinin yerine (koyu temaya uymuyor,
// çevrilemeyen "OK/Cancel" butonları var).
//
// - role="alertdialog" ve açıklama aria-describedby ile bağlı.
// - Açılışta odak "İptal"de (DOM'da ilk buton): yanlışlıkla Enter silmez.
// - İşlem sürerken pencere kapatılamaz ve butonlar kilitlenir.
// - open/onOpenChange verilirse dışarıdan kontrol edilir ve tetikleyici çizilmez
//   (ör. ⋯ menüsünden açılır).
export function ConfirmDialog({
  triggerLabel,
  triggerAriaLabel,
  triggerClassName,
  title,
  body,
  confirmLabel,
  onConfirm,
  open: openProp,
  onOpenChange,
}: {
  triggerLabel?: string;
  triggerAriaLabel?: string;
  triggerClassName?: string;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen, controlled] = useControllableOpen(openProp, onOpenChange);
  const [pending, startTransition] = useTransition();

  const close = () => {
    if (!pending) setOpen(false);
  };

  function confirm() {
    startTransition(async () => {
      await onConfirm();
      setOpen(false);
    });
  }

  return (
    <>
      {!controlled && (
        <button
          type="button"
          aria-label={triggerAriaLabel}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className={triggerClassName}
        >
          {triggerLabel}
        </button>
      )}

      <Modal
        open={open}
        onClose={close}
        role="alertdialog"
        heading={title}
        description={
          <>
            <p>{body}</p>
            <p className="mt-2 font-medium text-ink">{t.common.irreversible}</p>
          </>
        }
      >
        <ModalActions>
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className={buttonClass({ variant: "secondary" })}
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className={buttonClass({ variant: "destructive" })}
          >
            {pending ? t.common.deleting : confirmLabel}
          </button>
        </ModalActions>
      </Modal>
    </>
  );
}
