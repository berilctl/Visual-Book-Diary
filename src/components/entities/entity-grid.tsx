"use client";

import type { Entity, EntityKind } from "@/lib/entities";
import { useI18n } from "@/components/i18n-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { CharacterIcon, LocationIcon } from "@/components/ui/icons";
import { EntityCard } from "./entity-card";
import { EntityFormDialog } from "./entity-form-dialog";

const EMPTY_ICONS: Record<EntityKind, typeof CharacterIcon> = {
  characters: CharacterIcon,
  locations: LocationIcon,
};

// A list of characters or locations: masonry (pure CSS columns), the add
// button and the empty state.
export function EntityGrid({
  kind,
  bookId,
  items,
}: {
  kind: EntityKind;
  bookId: string;
  items: Entity[];
}) {
  const { t } = useI18n();
  const label = t.entityKinds[kind];

  if (items.length === 0) {
    const Icon = EMPTY_ICONS[kind];
    return (
      <EmptyState
        icon={<Icon className="size-7" />}
        title={label.emptyTitle}
        hint={label.emptyHint}
        action={<EntityFormDialog kind={kind} bookId={bookId} />}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">
          {label.count(items.length)}
        </p>
        <EntityFormDialog kind={kind} bookId={bookId} />
      </div>

      {/* Pure CSS columns fill column by column (top to bottom), which is the
          intended order here. */}
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
