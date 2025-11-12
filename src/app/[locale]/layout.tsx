import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import { locales } from "@/i18n/config";
import { ThemeProvider } from "@/contexts/theme-context";
import { SessionProvider } from "next-auth/react";

import type { Metadata } from 'next'
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type AppLocale,
  L10N,
  OG_LOCALE_MAP,
  getLocalePrefix,
  getSiteUrl,
} from '@/lib/i18n'


function normalizeLocale(input: string): AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(input) ? (input as AppLocale) : DEFAULT_LOCALE
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = getSiteUrl()
  const realLocale = normalizeLocale(locale)
  const prefix = getLocalePrefix(realLocale)
  const canonical = `${siteUrl}${prefix || '/'}`
  const ogImage = `${siteUrl}/og.jpg`

  // 生成 hreflang 映射
  const alternatesLanguages = SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, l) => {
    const p = getLocalePrefix(l)
    acc[l] = `${siteUrl}${p || '/'}`
    return acc
  }, {})

  // 其它语言（用于 og:locale:alternate）
  const alternateOgLocales = SUPPORTED_LOCALES.filter(l => l !== locale).map(l => OG_LOCALE_MAP[l])

  return {
    // （可省略）如需覆盖，可再次设定；否则沿用 root 的 metadataBase
    // metadataBase: new URL(siteUrl),

    title: {
      template: L10N.titleTemplate[realLocale],      // 本地化模板
      default: L10N.titleDefault[realLocale],        // 本地化默认标题
    },
    description: L10N.description[realLocale],
    keywords: Array.from(L10N.keywords[realLocale]),

    alternates: {
      canonical,             // 按当前 locale 输出 canonical
      languages: alternatesLanguages, // hreflang
    },

    openGraph: {
      siteName: 'Claude-ide',
      type: 'website',
      title: L10N.ogTitle[realLocale],
      description: L10N.ogDesc[realLocale],
      url: canonical,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'Claude-ide - Affordable AI Coding Assistance for Developers',
        },
      ],
      locale: OG_LOCALE_MAP[realLocale],
      alternateLocale: alternateOgLocales,
    },

    twitter: {
      card: 'summary_large_image',
      title: L10N.twitterTitle[realLocale],
      description: L10N.twitterDesc[realLocale],
      images: [ogImage],
    },
  }
}


export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}


export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  setRequestLocale(locale);
  const messages = await getMessages();


  return (
    <SessionProvider>
      <ThemeProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <main>
            {children}
          </main>
        </NextIntlClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
