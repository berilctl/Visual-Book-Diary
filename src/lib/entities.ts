// Karakter ve mekan aynı kart mantığını paylaşır; "kind" ile parametrelenir.
// kind değeri doğrudan tablo adıdır (characters / locations).
export const ENTITY_KINDS = ["characters", "locations"] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const ENTITY_LABELS: Record<
  EntityKind,
  {
    singular: string;
    addCta: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
    tagsPlaceholder: string;
  }
> = {
  characters: {
    singular: "karakter",
    addCta: "+ Karakter Ekle",
    namePlaceholder: "örn. Mina Harker",
    descriptionPlaceholder: "Görünüş, kişilik, önemli özellikler…",
    tagsPlaceholder: "virgülle ayır: Vampir, Antagonist",
  },
  locations: {
    singular: "mekan",
    addCta: "+ Mekan Ekle",
    namePlaceholder: "örn. Whitby Manastırı",
    descriptionPlaceholder: "Görünüş, atmosfer, hikâyedeki önemi…",
    tagsPlaceholder: "virgülle ayır: Şato, Köy, Gizemli",
  },
};

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
