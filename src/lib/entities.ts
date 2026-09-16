// Karakter ve mekan aynı kart mantığını paylaşır; "kind" ile parametrelenir.
// kind değeri doğrudan tablo adıdır (characters / locations).
export const ENTITY_KINDS = ["characters", "locations"] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

// Türe özgü arayüz metinleri sözlükte: t.entityKinds[kind].

export type Entity = {
  id: string;
  book_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  tags: string[];
  created_at: string;
};

export function isEntityKind(value: unknown): value is EntityKind {
  return (
    typeof value === "string" &&
    (ENTITY_KINDS as readonly string[]).includes(value)
  );
}
