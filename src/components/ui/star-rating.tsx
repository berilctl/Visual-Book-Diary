"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { StarIcon } from "@/components/ui/icons";
import { RATING_MAX, RATING_MIN } from "@/lib/books";

const STARS = Array.from(
  { length: RATING_MAX - RATING_MIN + 1 },
  (_, i) => RATING_MIN + i,
);

const SIZES = {
  sm: "size-3.5",
  md: "size-6",
  lg: "size-9",
} as const;

// 5 yıldızlı puan.
// - onChange yoksa salt okunur: ekran okuyucuya tek bir "5 üzerinden 4 yıldız".
// - onChange varsa WAI-ARIA radio group: şeride tek Tab durağı (roving
//   tabindex), ok tuşları/Home/End ile seçim, fareyle üzerine gelince önizleme.
export function StarRating({
  value,
  onChange,
  size = "md",
  disabled = false,
}: {
  value: number | null;
  onChange?: (value: number) => void;
  size?: keyof typeof SIZES;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<number | null>(null);
  const refs = useRef<Partial<Record<number, HTMLButtonElement | null>>>({});
  const current = value ?? 0;

  if (!onChange) {
    return (
      <span
        role="img"
        aria-label={current ? t.rating.outOfFive(current) : t.rating.notRated}
        className="inline-flex items-center gap-0.5 text-gold"
      >
        {STARS.map((n) => (
          <StarIcon
            key={n}
            filled={n <= current}
            className={`${SIZES[size]} ${n <= current ? "" : "text-line-strong"}`}
          />
        ))}
      </span>
    );
  }

  const shown = hovered ?? current;
  const choose = (n: number) => {
    onChange(n);
    refs.current[n]?.focus();
  };

  function handleKeyDown(event: React.KeyboardEvent) {
    const from = current || RATING_MIN - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      next = Math.min(RATING_MAX, from + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      next = Math.max(RATING_MIN, from - 1);
    } else if (event.key === "Home") {
      next = RATING_MIN;
    } else if (event.key === "End") {
      next = RATING_MAX;
    }
    if (next === null) return;
    event.preventDefault();
    if (!disabled) choose(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label={t.rating.label}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHovered(null)}
      className="inline-flex items-center gap-1"
    >
      {STARS.map((n) => {
        const selected = n === current;
        // Seçim yoksa ilk yıldız Tab durağı olur.
        const tabbable = current ? selected : n === RATING_MIN;
        return (
          <button
            key={n}
            ref={(el) => {
              refs.current[n] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t.rating.star(n)}
            tabIndex={tabbable ? 0 : -1}
            disabled={disabled}
            onClick={() => choose(n)}
            onMouseEnter={() => setHovered(n)}
            className={`rounded-md p-0.5 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 ${
              n <= shown ? "text-gold" : "text-line-strong"
            }`}
          >
            <StarIcon filled={n <= shown} className={SIZES[size]} />
          </button>
        );
      })}
    </div>
  );
}
