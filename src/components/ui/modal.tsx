import type { ReactNode } from "react";
import { cardClass } from "@/components/ui/card";

// Üç diyalogda birebir kopyalanan modal kabuğu. Davranış şimdilik eskisiyle
// aynı (overlay tıklaması kapatır); klavye/odak erişilebilirliği Adım 6'da
// buraya tek yerden eklenecek.
export function Modal({
  open,
  onClose,
  heading,
  children,
}: {
  open: boolean;
  onClose: () => void;
  heading: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-overlay"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto p-6 shadow-lift ${cardClass}`}
      >
        <h2 className="mb-5 font-serif text-xl text-ink">{heading}</h2>
        {children}
      </div>
    </div>
  );
}

// Diyalogların alt aksiyon satırı (İptal + onay) — o da her yerde aynıydı.
export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex justify-end gap-2">{children}</div>;
}
