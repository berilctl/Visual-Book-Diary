import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

// Form kontrollerinin ortak görünümü. Daha önce bu string 10 dosyada
// birebir kopyalıydı.
// Not: odak halkasını iptal eden utility bilerek kaldırıldı. Tailwind
// utility'leri base katmanını ezdiği için globals.css'teki :focus-visible
// halkasını yok ediyordu; kenarlık rengiyle birlikte halka da görünmeli.
export const controlClass =
  "w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm " +
  "text-ink placeholder:text-ink-subtle transition " +
  "focus:border-accent disabled:opacity-50";

// Etiket + kontrol + opsiyonel ipucu sarmalayıcısı.
export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">
        {label}
        {required && " *"}
      </span>
      {children}
      {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
    </label>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${className ?? ""}`} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={`${controlClass} resize-y ${className ?? ""}`} {...props} />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlClass} ${className ?? ""}`} {...props} />;
}
