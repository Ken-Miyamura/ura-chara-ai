"use client";

import type { Locale } from "@/i18n/config";
import { getDictionarySync } from "@/i18n/getDictionary";

interface FooterProps {
  locale?: Locale;
}

export default function Footer({ locale = "ja" }: FooterProps) {
  const dict = getDictionarySync(locale);

  return (
    <footer className="py-8 text-center text-xs text-zinc-500">
      <p>{dict.common.footer.privacy}</p>
      <p className="mt-1">{dict.common.footer.copyright}</p>
    </footer>
  );
}
