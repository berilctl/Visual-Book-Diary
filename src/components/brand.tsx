import { BookIcon } from "@/components/ui/icons";

// Marka işareti. Tek yerde tanımlı; landing'de tam hâli, panel başlıklarında
// kompakt hâli kullanılır.

export function BrandIcon({ className = "size-10" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-accent text-accent-contrast ${className}`}
    >
      <BookIcon className="size-[58%]" strokeWidth={1.6} />
    </span>
  );
}

export function BrandMark({
  iconClassName,
  textClassName = "text-xl",
}: {
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <BrandIcon className={iconClassName} />
      <span className={`font-serif text-ink ${textClassName}`}>
        Visual Book Diary
      </span>
    </span>
  );
}
