import type { Metadata } from 'next';
import Header from '@/components/header';
import { getTranslations } from 'next-intl/server';
import { MagicLinkClient } from './client';

export const metadata: Metadata = {
  title: 'Magic Link - CodeILab',
};

export default async function MagicLinkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('auth');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="w-full max-w-md">
          <MagicLinkClient
            locale={locale}
            labels={{
              heading: t('magicLinkHeading'),
              checking: t('magicLinkChecking'),
              redirecting: t('magicLinkRedirecting'),
              invalid: t('magicLinkInvalid'),
              alreadyUsed: t('magicLinkAlreadyUsed'),
              backToLogin: t('magicLinkBackToLogin'),
            }}
          />
        </div>
      </div>
    </div>
  );
}
