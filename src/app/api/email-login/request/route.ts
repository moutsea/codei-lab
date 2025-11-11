import { NextResponse } from "next/server";
import { issueEmailMagicLinkToken, MAGIC_LINK_TOKEN_TTL_MINUTES } from "@/lib/auth/email-login";
import { sendMagicLinkEmail } from "@/lib/email/magic-link";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export async function POST(request: Request) {
  try {
    const { email, locale = "en", redirectTo } = await request
      .json()
      .catch(() => ({ email: null }));

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });
    }

    const { token, email: normalizedEmail } = await issueEmailMagicLinkToken(email, locale);

    const path = locale === "en" ? "/magic-link" : `/${locale}/magic-link`;
    const magicLinkUrl = new URL(path, getBaseUrl());
    magicLinkUrl.searchParams.set("token", token);
    magicLinkUrl.searchParams.set("email", normalizedEmail);
    magicLinkUrl.searchParams.set("locale", locale);
    if (redirectTo && typeof redirectTo === "string") {
      magicLinkUrl.searchParams.set("redirectTo", redirectTo);
    }

    await sendMagicLinkEmail({
      to: normalizedEmail,
      magicLink: magicLinkUrl.toString(),
      expiresInMinutes: MAGIC_LINK_TOKEN_TTL_MINUTES,
      locale,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send magic link email", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
