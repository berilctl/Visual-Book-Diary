"use client";

import { useState } from "react";
import { EntityGrid } from "@/components/entities/entity-grid";
import { QuoteList } from "@/components/quotes/quote-list";
import type { Entity } from "@/lib/entities";
import type { Quote } from "@/lib/quotes";

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
  quotes,
}: {
  bookId: string;
  characters: Entity[];
  locations: Entity[];
  quotes: Quote[];
}) {
  const [active, setActive] = useState<TabKey>("characters");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Kitap içeriği"
        className="flex gap-1 border-b border-line"
      >
        {TABS.map((tab) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.key)}
              className={`-mb-px min-h-11 border-b-2 px-4 text-sm font-medium transition ${
                selected
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-muted hover:text-ink"
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
          <QuoteList bookId={bookId} quotes={quotes} characters={characters} />
        )}
      </div>
    </div>
  );
}
