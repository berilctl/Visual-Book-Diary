import { BookIcon } from "@/components/ui/icons";

// A book cover in 2:3, the proportion of a printed book. The caller decides
// the width: the component sets no width class of its own, because a w-full of
// equal specificity would beat a w-24 passed in, depending on source order. As
// a block element it fills its container when no width is given.
//
// - With a cover image: the image plus a subtle spine shadow on the left edge.
// - Without one: a typographic cover with a soft background derived from the
//   book, a serif title and the author, so it still reads as a book on a shelf.
// - At "thumb" size (the form preview) there is no room for text, so only the
//   book icon is drawn.

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
        {/* eslint-disable-next-line @next/next/no-img-element -- Storage images; next/image is deliberately not used in this project */}
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
      {/* Spine: a darker strip along the left edge that suggests a bound book. */}
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
