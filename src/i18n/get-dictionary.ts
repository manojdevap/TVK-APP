import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";
import { en } from "./dictionaries/en";
import { ta } from "./dictionaries/ta";

const dictionaries: Record<Locale, Dictionary> = { en, ta };

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale] ?? dictionaries.en;
}
