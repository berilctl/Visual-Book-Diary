"use client";

import { useFormStatus } from "react-dom";

// Bir <form> içindeki submit'in pending durumunu (useFormStatus) yansıtır:
// pending iken disable olur ve metni değişir. İşlevsel davranışı değiştirmez,
// yalnızca geri bildirim ekler — özellikle silme form'larında.
export function SubmitButton({
  idleLabel,
  pendingLabel,
  className,
  ariaLabel,
}: {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={ariaLabel}
      className={className}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
