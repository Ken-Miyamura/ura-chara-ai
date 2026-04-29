import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleHtmlLang } from "@/components/ui/LocaleHtmlLang";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const dict = await getDictionary(locale);

  const ogImage = `/og-image-${locale}.png`;
  const ogLocale = locale === "ja" ? "ja_JP" : locale === "en" ? "en_US" : "es_ES";

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    openGraph: {
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      type: "website",
      locale: ogLocale,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: dict.meta.ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      images: [ogImage],
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div data-locale={locale as Locale}>
      <LocaleHtmlLang locale={locale as Locale} />
      {children}
    </div>
  );
}
