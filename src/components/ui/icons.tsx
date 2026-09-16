import type { ReactNode } from "react";

// Uygulamanın ikon seti. Kitap glyph'i marka, kapak placeholder'ı ve boş
// durumlarda ayrı ayrı kopyalanmıştı; hepsi buradan geliyor.

function Icon({
  className = "size-5",
  strokeWidth = 1.5,
  children,
}: {
  className?: string;
  strokeWidth?: number;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string; strokeWidth?: number };

export function BookIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 7c-1.9-1.4-4.2-2.1-6.8-2.1-.8 0-1.5.1-2.2.2v12.6c.7-.1 1.4-.2 2.2-.2 2.6 0 4.9.7 6.8 2.1 1.9-1.4 4.2-2.1 6.8-2.1.8 0 1.5.1 2.2.2V5.1c-.7-.1-1.4-.2-2.2-.2-2.6 0-4.9.7-6.8 2.1Z" />
      <path d="M12 7v12.6" />
    </Icon>
  );
}

export function CharacterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.8 19.6a7.4 7.4 0 0 1 14.4 0" />
    </Icon>
  );
}

export function LocationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21.2s6.8-5.6 6.8-10.4a6.8 6.8 0 1 0-13.6 0C5.2 15.6 12 21.2 12 21.2Z" />
      <circle cx="12" cy="10.6" r="2.5" />
    </Icon>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.4 6.4C6.6 7.6 4.8 10.2 4.8 13.4c0 2.3 1.5 4.2 3.6 4.2 1.9 0 3.3-1.4 3.3-3.2 0-1.8-1.3-3.1-3-3.1-.3 0-.7 0-1 .2.4-1.4 1.5-2.6 3-3.3Z" />
      <path d="M18.4 6.4c-2.8 1.2-4.6 3.8-4.6 7 0 2.3 1.5 4.2 3.6 4.2 1.9 0 3.3-1.4 3.3-3.2 0-1.8-1.3-3.1-3-3.1-.3 0-.7 0-1 .2.4-1.4 1.5-2.6 3-3.3Z" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 14.4A8.6 8.6 0 0 1 9.6 3.5a8.6 8.6 0 1 0 10.9 10.9Z" />
    </Icon>
  );
}
