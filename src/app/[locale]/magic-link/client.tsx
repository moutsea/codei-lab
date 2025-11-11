'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn, type SignInResponse } from 'next-auth/react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type MagicLinkStatus = 'loading' | 'success' | 'error';

type MagicLinkStatusResponse = {
  status: 'valid' | 'expired' | 'consumed' | 'not_found' | 'email_mismatch';
  expiresAt?: string;
  consumedAt?: string;
};

interface MagicLinkClientProps {
  locale: string;
  labels: {
    heading: string;
    checking: string;
    redirecting: string;
    invalid: string;
    alreadyUsed: string;
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
  const attemptedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function verifyAndSignIn() {
      if (!emailParam || !tokenParam) {
        setStatus('error');
        setErrorMessage(labels.invalid);
        return;
      }

      const fallbackRedirect = locale === 'en' ? '/' : `/${locale}`;
      const callbackUrl = redirectParam || fallbackRedirect;
      const attemptKey = `${emailParam}:${tokenParam}`;

      if (attemptedKeyRef.current === attemptKey) {
        return;
      }

      try {
        const params = new URLSearchParams({ email: emailParam, token: tokenParam });
        const response = await fetch(`/api/auth/magiclink/status?${params.toString()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to load magic link status (${response.status})`);
        }

        const payload = (await response.json()) as MagicLinkStatusResponse;

        if (cancelled) {
          return;
        }

        if (payload.status === 'consumed') {
          setStatus('error');
          setErrorMessage(labels.alreadyUsed);
          return;
        }

        if (payload.status !== 'valid') {
          setStatus('error');
          setErrorMessage(labels.invalid);
          return;
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Magic link status check failed', error);
          setStatus('error');
          setErrorMessage(labels.invalid);
        }
        return;
      }

      attemptedKeyRef.current = attemptKey;

      signIn('magiclink', {
        email: emailParam,
        token: tokenParam,
        callbackUrl,
        redirect: true,
      })
        .then(() => {
          setStatus('success');
        })
        .catch((error) => {
          attemptedKeyRef.current = null;
          console.error('Magic link sign-in failed', error);
          setStatus('error');
          setErrorMessage(labels.invalid);
        });
    }

    verifyAndSignIn();

    return () => {
      cancelled = true;
    };
  }, [emailParam, tokenParam, redirectParam, locale, labels.invalid, labels.alreadyUsed]);

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
