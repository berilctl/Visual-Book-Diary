import { ENTITY_LABELS, type Entity, type EntityKind } from "@/lib/entities";
import { EntityCard } from "./entity-card";
import { EntityFormDialog } from "./entity-form-dialog";

// Karakter/mekan listesi: masonry (pure CSS columns) + ekleme + boş durum.
export function EntityGrid({
  kind,
  bookId,
  items,
}: {
  kind: EntityKind;
  bookId: string;
  items: Entity[];
}) {
  const label = ENTITY_LABELS[kind];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-black/55 dark:text-white/55">
          {items.length} {label.singular}
        </p>
        <EntityFormDialog kind={kind} bookId={bookId} />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-black/15 px-6 py-16 text-center dark:border-white/15">
          <p className="text-sm text-black/55 dark:text-white/55">
            Henüz {label.singular} yok.
          </p>
        </div>
      ) : (
        // Pure CSS columns — sütun sütun (yukarıdan aşağı) dizer; bilinçli
        // tercih (PRD Bölüm 7).
        <div className="gap-4 sm:columns-2 lg:columns-3">
          {items.map((entity) => (
            <EntityCard
              key={entity.id}
              kind={kind}
              bookId={bookId}
              entity={entity}
            />
          ))}
        </div>
      )}
    </div>
  );
}
