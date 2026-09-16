import { BookIcon } from "@/components/ui/icons";

// Kitap kapağı, 2:3 oranında (basılı kitap oranı). Genişliği çağıran belirler:
// bileşen kendi genişlik sınıfı koymaz, çünkü aynı özgüllükteki w-full ile
// dışarıdan gelen w-24 çakışınca CSS sırasına göre w-full kazanıyordu (detay
// sayfasında kapak mobilde tam genişliğe yayılıyordu). Blok eleman olduğu için
// genişlik verilmezse kapsayıcıyı doldurur.
//
// - Kapak görseli varsa: görsel + sol kenarda hafif bir sırt gölgesi.
// - Yoksa tipografik kapak: kitaba göre değişen yumuşak zemin, serif başlık,
//   yazar. Kapaksız kitaplar da rafta bir kitap gibi görünür.
// - "thumb" boyutu (form önizlemesi) metin sığmayacak kadar küçük; orada
//   yalnızca kitap ikonu çizilir.

const TINTS = [
  "bg-accent-soft text-accent",
  "bg-gold-soft text-gold",
  "bg-success-soft text-success",
];

function tintFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return TINTS[hash % TINTS.length];
}

type Size = "card" | "hero" | "thumb";

const TEXT: Record<Exclude<Size, "thumb">, { title: string; author: string }> = {
  card: { title: "text-lg", author: "text-[0.65rem]" },
  hero: { title: "text-base sm:text-lg", author: "text-[0.6rem] sm:text-[0.65rem]" },
};

export function BookCover({
  seed,
  title,
  author,
  coverUrl,
  size = "card",
  className = "",
}: {
  seed: string;
  title?: string;
  author?: string;
  coverUrl?: string | null;
  size?: Size;
  className?: string;
}) {
  const frame = `relative aspect-[2/3] overflow-hidden ${className}`;

  if (coverUrl) {
    return (
      <div className={`${frame} bg-surface-sunken`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Storage görselleri; projede next/image bilinçli kullanılmıyor */}
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/25 to-transparent"
        />
      </div>
    );
  }

  const tint = tintFor(seed);

  if (size === "thumb" || !title) {
    return (
      <div className={`${frame} flex items-center justify-center ${tint}`}>
        <BookIcon className="size-1/3 opacity-60" strokeWidth={1.4} />
      </div>
    );
  }

  return (
    <div className={`${frame} ${tint}`}>
      {/* Sırt: sol kenarda koyu bir şerit, kapağa cilt hissi verir. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[7%] bg-current opacity-10"
      />
      <div className="relative flex h-full flex-col py-[10%] pl-[16%] pr-[10%]">
        <span aria-hidden className="h-px w-1/4 bg-current opacity-40" />
        <p
          className={`mt-[14%] line-clamp-5 break-words font-serif leading-tight ${TEXT[size].title}`}
        >
          {title}
        </p>
        {author && (
          <p
            className={`mt-auto line-clamp-2 uppercase tracking-[0.14em] opacity-75 ${TEXT[size].author}`}
          >
            {author}
          </p>
        )}
      </div>
    </div>
  );
}
