"use client";

import { useRef, useState } from "react";
import { EntityGrid } from "@/components/entities/entity-grid";
import { QuoteList } from "@/components/quotes/quote-list";
import type { Entity } from "@/lib/entities";
import type { Quote } from "@/lib/quotes";
import { useI18n } from "@/components/i18n-provider";

type TabKey = "characters" | "locations" | "quotes";

const TABS: { key: TabKey }[] = [
  { key: "characters" },
  { key: "locations" },
  { key: "quotes" },
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
  const { t } = useI18n();
  const [active, setActive] = useState<TabKey>("characters");

  const tabLabel = (key: TabKey) =>
    key === "quotes" ? t.quotes.tab : t.entityKinds[key].tab;

  // Roving tabindex: şeride tek Tab durağı düşer, sekmeler arası geçiş ok
  // tuşlarıyla yapılır (WAI-ARIA tabs deseni).
  const tabRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = TABS.findIndex((tab) => tab.key === active);
    let next: number;
    if (event.key === "ArrowRight") next = (current + 1) % TABS.length;
    else if (event.key === "ArrowLeft")
      next = (current - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;

    event.preventDefault();
    const key = TABS[next].key;
    setActive(key);
    tabRefs.current[key]?.focus();
  }

  const counts: Record<TabKey, number> = {
    characters: characters.length,
    locations: locations.length,
    quotes: quotes.length,
  };

  return (
    <div>
      {/* Ayırıcı çizgi border yerine inset gölge: overflow-x-auto (dar
          ekranlarda sekmeler kaydırılabilsin diye) overflow-y'yi de auto
          yapıyor ve -mb-px numarasının yarattığı 1px taşma sekme şeridinde
          dikey kaydırma çubuğu gösteriyordu. */}
      <div
        role="tablist"
        aria-label={t.book.tabsLabel}
        onKeyDown={handleTabKeyDown}
        className="flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--line)]"
      >
        {TABS.map((tab) => {
          const selected = tab.key === active;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              ref={(el) => {
                tabRefs.current[tab.key] = el;
              }}
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              aria-controls={`panel-${tab.key}`}
              onClick={() => setActive(tab.key)}
              className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-2.5 text-sm font-medium transition sm:px-4 ${
                selected
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {tabLabel(tab.key)}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                  selected
                    ? "bg-accent-soft text-accent"
                    : count > 0
                      ? "bg-surface-sunken text-ink-muted"
                      : "text-ink-subtle"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Her sekmenin kendi paneli var; aria-labelledby ile başlığına bağlı. */}
      <div className="py-8">
        {TABS.map((tab) => (
          <div
            key={tab.key}
            id={`panel-${tab.key}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.key}`}
            hidden={tab.key !== active}
          >
            {tab.key === active && tab.key === "characters" && (
              <EntityGrid kind="characters" bookId={bookId} items={characters} />
            )}
            {tab.key === active && tab.key === "locations" && (
              <EntityGrid kind="locations" bookId={bookId} items={locations} />
            )}
            {tab.key === active && tab.key === "quotes" && (
              <QuoteList
                bookId={bookId}
                quotes={quotes}
                characters={characters}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
