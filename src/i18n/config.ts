// === i18n Configuration ===

export const supportedLocales = ["ja", "en", "es"] as const;
export const defaultLocale = "ja" as const;

export type Locale = (typeof supportedLocales)[number];

export function isValidLocale(value: string): value is Locale {
  return (supportedLocales as readonly string[]).includes(value);
}
