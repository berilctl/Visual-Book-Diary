import type { ReactNode } from "react";

// Tüm "henüz X yok" durumları için tutarlı, davetkâr boş durum.
// icon opsiyonel: verilirse yumuşak aksan zeminli bir daire içinde gösterilir.
export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
      {icon && (
        <span className="mb-1 inline-flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          {icon}
        </span>
      )}
      <p className="font-serif text-lg text-ink">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-muted">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
