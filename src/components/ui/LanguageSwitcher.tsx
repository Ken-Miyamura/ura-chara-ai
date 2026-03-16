"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { supportedLocales } from "@/i18n/config";

interface LanguageSwitcherProps {
  locale: Locale;
}

const localeLabels: Record<Locale, string> = {
  ja: "JP",
  en: "EN",
  es: "ES",
};

const localeFlags: Record<Locale, string> = {
  ja: "\ud83c\uddef\ud83c\uddf5",
  en: "\ud83c\uddec\ud83c\udde7",
  es: "\ud83c\uddea\ud83c\uddf8",
};

export default function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Replace the current locale segment in the path
    const segments = pathname.split("/");
    // segments[0] is "", segments[1] is the locale
    if (segments.length >= 2) {
      segments[1] = newLocale;
    }
    const newPath = segments.join("/") || `/${newLocale}`;
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1">
      {supportedLocales.map((loc) => (
        <button
          type="button"
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            loc === locale
              ? "bg-primary/20 text-primary-light font-medium"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          }`}
          title={`${localeFlags[loc]} ${localeLabels[loc]}`}
        >
          {localeFlags[loc]}
        </button>
      ))}
    </div>
  );
}
