import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/header';
import { EmailLoginForm, LoginButtonClient } from './client';
import { MAGIC_LINK_TOKEN_TTL_MINUTES } from '@/lib/auth/email-login';

export const metadata: Metadata = {
  title: 'Login - CodeILab',
  description: 'Sign in to your CodeILab account',
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('auth');
  const redirectTo = locale === 'en' ? '/' : `/${locale}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('signInTitle')}
            </h1>
            <p className="text-muted-foreground">
              {t('signInDescription')}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <div className="space-y-4">
              <LoginButtonClient provider="google" />
              <LoginButtonClient provider="github" />
              <LoginButtonClient provider="microsoft" />
            </div>

            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs tracking-wide uppercase text-muted-foreground">
                {t('or')}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <EmailLoginForm
              locale={locale}
              redirectTo={redirectTo}
              expiresInMinutes={MAGIC_LINK_TOKEN_TTL_MINUTES}
            />

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('noAccount')}{' '}
                <a href="#" className="text-primary hover:underline">
                  {t('signUp')}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
