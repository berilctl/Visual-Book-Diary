// İki/üç seçenekli mod anahtarı (giriş↔kayıt, dosya↔AI). Sekme değil, bir
// durum anahtarı olduğu için role="tab" yerine aria-pressed kullanır.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex gap-1 rounded-lg bg-surface-sunken p-1 ${className ?? ""}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-8 flex-1 rounded-md px-3 text-sm font-medium transition ${
              selected
                ? "bg-surface text-ink shadow-paper"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
