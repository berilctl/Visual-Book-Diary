import type { Locale } from "../config";
import { en } from "./en";
import { tr, type Dictionary } from "./tr";

export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { tr, en };
