import { ENTITY_LABELS, type Entity, type EntityKind } from "@/lib/entities";
import { EmptyState } from "@/components/ui/empty-state";
import { CharacterIcon, LocationIcon } from "@/components/ui/icons";
import { EntityCard } from "./entity-card";
import { EntityFormDialog } from "./entity-form-dialog";

const EMPTY_ICONS: Record<EntityKind, typeof CharacterIcon> = {
  characters: CharacterIcon,
  locations: LocationIcon,
};

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

  if (items.length === 0) {
    const Icon = EMPTY_ICONS[kind];
    return (
      <EmptyState
        icon={<Icon className="size-7" />}
        title={`Henüz ${label.singular} yok`}
        hint={`İlk ${label.singular} kartını ekle — görsel yükle ya da betimlemeden AI ile üret.`}
        action={<EntityFormDialog kind={kind} bookId={bookId} />}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">
          {items.length} {label.singular}
        </p>
        <EntityFormDialog kind={kind} bookId={bookId} />
      </div>

      {/* Pure CSS columns — sütun sütun (yukarıdan aşağı) dizer; bilinçli
          tercih (PRD Bölüm 7). */}
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
    </div>
  );
}
