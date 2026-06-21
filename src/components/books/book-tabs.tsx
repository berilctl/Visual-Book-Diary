"use client";

import { useState } from "react";
import { EntityGrid } from "@/components/entities/entity-grid";
import type { Entity } from "@/lib/entities";

type TabKey = "characters" | "locations" | "quotes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "characters", label: "Karakterler" },
  { key: "locations", label: "Mekanlar" },
  { key: "quotes", label: "Alıntılar" },
];

export function BookTabs({
  bookId,
  characters,
  locations,
}: {
  bookId: string;
  characters: Entity[];
  locations: Entity[];
}) {
  const [active, setActive] = useState<TabKey>("characters");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Kitap içeriği"
        className="flex gap-1 border-b border-black/10 dark:border-white/10"
      >
        {TABS.map((tab) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                selected
                  ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                  : "border-transparent text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="py-8">
        {active === "characters" && (
          <EntityGrid kind="characters" bookId={bookId} items={characters} />
        )}
        {active === "locations" && (
          <EntityGrid kind="locations" bookId={bookId} items={locations} />
        )}
        {active === "quotes" && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 px-6 py-16 text-center dark:border-white/15">
            <p className="text-sm text-black/55 dark:text-white/55">
              Henüz alıntı yok.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
