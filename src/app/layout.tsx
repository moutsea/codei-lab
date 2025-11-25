import "@/app/globals.css";
import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { Poppins } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from '@vercel/speed-insights/next';

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  style: "normal"
})

import { getSiteUrl } from '@/lib/i18n'

export const metadata: Metadata = {
  // 全局只放“与语言无关”的部分
  metadataBase: new URL(getSiteUrl()),
  robots: 'index, follow, max-image-preview:large',
  authors: [{ name: 'CodeI Team' }],
  creator: 'CodeI Team',
  publisher: 'CodeI Lab',
  category: 'Technology',
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '' },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  setRequestLocale(locale);

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const googleAdsenseCode = process.env.NEXT_PUBLIC_GOOGLE_ADCODE || "";

  return (
    <html lang={locale} className={poppins.className} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="google-site-verification" content="_32v18g-XDvB04tOz9Wg-8QgSzOiDVG8SfPrWPyncyo" />
        <meta name="msvalidate.01" content="8B900A7AD31AF4E513F58422B9EBA7E5" />
        {googleAdsenseCode && (
          <meta name="google-adsense-account" content={googleAdsenseCode} />
        )}

        <link rel="icon" href="/favicon.ico" />
        <link rel="alternate" hrefLang="x-default" href={webUrl} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
