import type { ButtonHTMLAttributes } from "react";

// Uygulamadaki tüm buton görünümlerinin tek kaynağı. Renkler tema token'ından
// gelir; odak halkası globals.css'teki genel :focus-visible kuralından.
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerQuiet";

export type ButtonSize = "sm" | "md" | "icon";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium " +
  "transition disabled:cursor-not-allowed disabled:opacity-50";

// min-h değerleri WCAG 2.2 "Target Size (Minimum)" 24px eşiğini rahat geçer;
// kart içindeki küçük aksiyonlar bile artık 32px yüksekliğinde.
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-8 px-2.5 text-xs",
  md: "min-h-10 px-4 text-sm",
  // Kare, yalnızca ikon içeren buton. Padding yok: dışarıdan `px-0` ile
  // ezmek güvenilir değil — aynı özgüllükteki px-4 CSS sırasına göre
  // kazanabiliyor (tema anahtarında ikonu 8px'e sıkıştırmıştı).
  icon: "size-10",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover",
  secondary: "border border-line-strong text-ink hover:bg-surface-sunken",
  ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
  danger: "border border-danger/40 text-danger hover:bg-danger-soft",
  dangerQuiet: "text-danger hover:bg-danger-soft",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return [BASE, SIZES[size], VARIANTS[variant], className]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  );
}
