import type { ReactNode } from "react";

// Kart/panel yüzeyi: ince kenarlık + çok yumuşak ambient gölge ("kâğıt" hissi,
// material tarzı ağır gölge değil).
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
