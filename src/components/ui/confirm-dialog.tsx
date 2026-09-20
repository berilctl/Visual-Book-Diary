"use client";

import { useTransition, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { buttonClass } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useControllableOpen } from "@/components/ui/use-controllable-open";

// Confirmation for irreversible actions: a trigger button plus a themed dialog.
// It replaces the browser's window.confirm(), which ignores the dark theme and
// has untranslatable "OK/Cancel" buttons.
//
// - role="alertdialog", with the description linked through aria-describedby.
// - Focus starts on "Cancel" (the first button in the DOM), so a stray Enter
//   never deletes anything.
// - While the action runs the dialog cannot be closed and the buttons are locked.
// - Passing open/onOpenChange controls it from the outside and hides the
//   trigger (it is then opened from the ⋯ menu, for example).
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
