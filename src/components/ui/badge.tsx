import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "accent" | "gold" | "success" | "danger";

// Coloured tones are filled, the neutral tone is outlined: in this warm
// palette bg-surface-sunken and bg-gold-soft read as nearly the same beige.
const TONES: Record<BadgeTone, string> = {
  neutral: "border border-line-strong text-ink-muted",
  accent: "bg-accent-soft text-accent",
  gold: "bg-gold-soft text-gold",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
