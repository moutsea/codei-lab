import { NextResponse } from 'next/server';
import { getMagicLinkTokenStatus } from '@/lib/auth/email-login';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email || !token) {
    return NextResponse.json(
      { error: 'missing_params' },
      { status: 400 },
    );
  }

  try {
    const status = await getMagicLinkTokenStatus(email, token);
    return NextResponse.json({
      status: status.status,
      expiresAt:
        'expiresAt' in status && status.expiresAt
          ? status.expiresAt.toISOString()
          : undefined,
      consumedAt:
        'consumedAt' in status && status.consumedAt
          ? status.consumedAt.toISOString()
          : undefined,
    });
  } catch (error) {
    console.error('[auth] Failed to load magic link status', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
