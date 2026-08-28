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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
      <p className="font-serif text-lg text-ink">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-muted">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
