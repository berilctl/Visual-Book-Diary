import type { Entity, EntityKind } from "@/lib/entities";
import { DeleteEntityButton } from "./delete-entity-button";

// Masonry'de kartların yükseklikleri görselin doğal en-boy oranıyla değişir;
// bu yüzden sabit boyutlu next/image yerine düz <img> + w-full/h-auto kullanıyoruz.
export function EntityCard({
  kind,
  bookId,
  entity,
}: {
  kind: EntityKind;
  bookId: string;
  entity: Entity;
}) {
  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
      {entity.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- masonry doğal oran gerektirir
        <img
          src={entity.image_url}
          alt={entity.name}
          loading="lazy"
          className="h-auto w-full object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{entity.name}</h3>
          <DeleteEntityButton
            kind={kind}
            bookId={bookId}
            id={entity.id}
            name={entity.name}
          />
        </div>

        {entity.description && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-black/60 dark:text-white/60">
            {entity.description}
          </p>
        )}

        {entity.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entity.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-black/70 dark:bg-white/10 dark:text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
