// Marka işareti. Tek yerde tanımlı; landing'de tam hâli, panel başlığında
// (Adım 4) kompakt hâli kullanılacak.

export function BrandIcon({ className = "size-10" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-accent text-accent-contrast ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[58%]"
        aria-hidden
      >
        {/* Açık kitap: iki sayfa + orta sırt */}
        <path d="M12 7c-1.9-1.4-4.2-2.1-6.8-2.1-.8 0-1.5.1-2.2.2v12.6c.7-.1 1.4-.2 2.2-.2 2.6 0 4.9.7 6.8 2.1 1.9-1.4 4.2-2.1 6.8-2.1.8 0 1.5.1 2.2.2V5.1c-.7-.1-1.4-.2-2.2-.2-2.6 0-4.9.7-6.8 2.1Z" />
        <path d="M12 7v12.6" />
      </svg>
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
