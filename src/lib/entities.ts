// Characters and locations share the same card behaviour, parameterised by
// "kind". The kind is also the table name (characters / locations).
export const ENTITY_KINDS = ["characters", "locations"] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

// Kind-specific interface strings live in the dictionary: t.entityKinds[kind].

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
