"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import type { Locale } from "@/i18n/config";
import { getDictionarySync } from "@/i18n/getDictionary";

interface HeaderProps {
  locale?: Locale;
}

export default function Header({ locale = "ja" }: HeaderProps) {
  const dict = getDictionarySync(locale);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="text-lg font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
            {dict.common.appName}
          </span>
        </Link>
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
