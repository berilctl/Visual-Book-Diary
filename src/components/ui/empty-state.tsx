import type { ReactNode } from "react";

// Tüm "henüz X yok" durumları için tutarlı, davetkâr boş durum.
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/15 px-6 py-16 text-center dark:border-white/15">
      <p className="text-base font-medium">{title}</p>
      {hint && (
        <p className="max-w-sm text-sm text-black/55 dark:text-white/55">
          {hint}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
