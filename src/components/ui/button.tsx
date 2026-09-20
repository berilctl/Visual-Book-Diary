import type { ButtonHTMLAttributes } from "react";

// The single source for every button appearance in the app. Colours come from
// the theme tokens; the focus ring from the global :focus-visible rule in
// globals.css.
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerQuiet"
  | "destructive";

export type ButtonSize = "sm" | "md" | "icon";

// whitespace-nowrap keeps button labels on one line on narrow screens
// ("Sign Out" used to wrap in the mobile header).
const BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg " +
  "font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

// The min-h values clear the 24px threshold of WCAG 2.2 "Target Size
// (Minimum)" comfortably; even small in-card actions are 32px tall.
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-8 px-2.5 text-xs",
  md: "min-h-10 px-4 text-sm",
  // Square, icon-only button. It carries no padding of its own, because
  // overriding padding from the outside with `px-0` is unreliable: px-4 has the
  // same specificity and can win on source order.
  icon: "size-10",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover",
  secondary: "border border-line-strong text-ink hover:bg-surface-sunken",
  ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
  danger: "border border-danger/40 text-danger hover:bg-danger-soft",
  dangerQuiet: "text-danger hover:bg-danger-soft",
  // The final step in a confirmation dialog: a solid colour for the irreversible action.
  destructive: "bg-danger text-danger-contrast hover:opacity-90",
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
