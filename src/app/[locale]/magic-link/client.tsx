'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type MagicLinkStatus = 'loading' | 'success' | 'error';

interface MagicLinkClientProps {
  locale: string;
  labels: {
    heading: string;
    checking: string;
    redirecting: string;
    invalid: string;
    backToLogin: string;
  };
}

export function MagicLinkClient({ locale, labels }: MagicLinkClientProps) {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const tokenParam = searchParams.get('token');
  const redirectParam = searchParams.get('redirectTo');
  const [status, setStatus] = useState<MagicLinkStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!emailParam || !tokenParam) {
      setStatus('error');
      setErrorMessage(labels.invalid);
      return;
    }

    const fallbackRedirect = locale === 'en' ? '/' : `/${locale}`;
    const callbackUrl = redirectParam || fallbackRedirect;

    signIn('magiclink', {
      email: emailParam,
      token: tokenParam,
      callbackUrl,
      redirect: true,
    })
      .then((result) => {
        if (result?.error) {
          setStatus('error');
          setErrorMessage(labels.invalid);
        } else {
          setStatus('success');
        }
      })
      .catch((error) => {
        console.error('Magic link sign-in failed', error);
        setStatus('error');
        setErrorMessage(labels.invalid);
      });
  }, [emailParam, tokenParam, redirectParam, locale, labels.invalid]);

  const loginHref = locale === 'en' ? '/login' : `/${locale}/login`;

  const renderIcon = () => {
    if (status === 'success') {
      return <CheckCircle2 className="h-12 w-12 text-green-500" />;
    }

    if (status === 'error') {
      return <XCircle className="h-12 w-12 text-red-500" />;
    }

    return <Loader2 className="h-12 w-12 text-primary animate-spin" />;
  };

  const message = (() => {
    if (status === 'success') {
      return labels.redirecting;
    }
    if (status === 'error') {
      return errorMessage ?? labels.invalid;
    }
    return labels.checking;
  })();

  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm text-center">
      <div className="flex justify-center mb-6">{renderIcon()}</div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">{labels.heading}</h1>
      <p className="text-muted-foreground mb-6">{message}</p>

      {status === 'error' && (
        <Button asChild variant="outline">
          <Link href={loginHref}>{labels.backToLogin}</Link>
        </Button>
      )}
    </div>
  );
}
