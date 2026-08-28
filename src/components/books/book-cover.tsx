import { BookIcon } from "@/components/ui/icons";

// Kitap kartının üst görsel alanı. Kitabın karakter/mekan kartlarından gelen
// görselleri şerit hâlinde gösterir; hiç görsel yoksa kitaba göre değişen
// yumuşak bir zemin + kitap glyph'i koyar (raf hissi için çeşitlilik).

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

export function BookCover({
  bookId,
  images,
}: {
  bookId: string;
  images: string[];
}) {
  if (images.length === 0) {
    return (
      <div
        className={`flex h-32 items-center justify-center ${tintFor(bookId)}`}
      >
        <BookIcon className="size-9 opacity-60" strokeWidth={1.4} />
      </div>
    );
  }

  return (
    <div className="flex h-32 gap-px bg-line">
      {images.slice(0, 3).map((src) => (
        // eslint-disable-next-line @next/next/no-img-element -- Storage görselleri, doğal oran gerekmez ama next/image projede bilinçli kullanılmıyor
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          className="h-full min-w-0 flex-1 object-cover"
        />
      ))}
    </div>
  );
}
