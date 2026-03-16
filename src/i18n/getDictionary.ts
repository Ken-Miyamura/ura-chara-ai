// === i18n Dictionary Loader ===

import type { Locale } from "./config";

import jaDict from "./locales/ja.json";
import enDict from "./locales/en.json";
import esDict from "./locales/es.json";

export type Dictionary = typeof jaDict;

const dictionaries: Record<Locale, Dictionary> = {
  ja: jaDict,
  en: enDict,
  es: esDict,
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale] ?? dictionaries.ja;
}

/** 同期版（クライアントコンポーネント用） */
export function getDictionarySync(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.ja;
}
