import type { ReactNode } from "react";

// Card and panel surface: a thin border plus a very soft ambient shadow — a
// sheet of paper rather than a material-style elevation.
export const cardClass = "rounded-2xl border border-line bg-surface shadow-paper";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`${cardClass} ${className ?? ""}`}>{children}</div>;
}
