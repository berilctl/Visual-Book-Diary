import type { Entity, EntityKind } from "@/lib/entities";
import { cardClass } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteEntityButton } from "./delete-entity-button";
import { EntityFormDialog } from "./entity-form-dialog";

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
    <div
      className={`group mb-4 break-inside-avoid overflow-hidden transition hover:shadow-lift ${cardClass}`}
    >
      {entity.image_url && (
        <div className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- masonry doğal oran gerektirir */}
          <img
            src={entity.image_url}
            alt={entity.name}
            loading="lazy"
            className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg leading-snug text-ink">
            {entity.name}
          </h3>
          <div className="flex shrink-0 items-center gap-0.5">
            <EntityFormDialog
              kind={kind}
              bookId={bookId}
              mode="edit"
              entity={entity}
            />
            <DeleteEntityButton
              kind={kind}
              bookId={bookId}
              id={entity.id}
              name={entity.name}
            />
          </div>
        </div>

        {entity.description && (
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
            {entity.description}
          </p>
        )}

        {entity.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entity.tags.map((tag) => (
              <Badge key={tag} tone="gold">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
