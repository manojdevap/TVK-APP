export const locales = ["en", "ta"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ta: "தமிழ்",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * Next types route params as plain strings, so narrow them here rather than
 * asserting the union at every page.
 */
export function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}
