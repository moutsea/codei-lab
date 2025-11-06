import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { StyleToggle } from '@/components/theme-toggle';
import Header from '@/components/header';
import { LoginButtonClient } from './client';

export const metadata: Metadata = {
  title: 'Login - CodeILab',
  description: 'Sign in to your CodeILab account',
};

export default async function LoginPage() {
  const t = await getTranslations('auth');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('welcomeBack')}
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