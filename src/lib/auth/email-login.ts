import { randomBytes, createHash, randomUUID } from "crypto";
import {
  createEmailLoginTokenRecord,
  deleteEmailLoginTokenById,
  deleteEmailLoginTokensForEmail,
  getEmailLoginTokenByHash,
  markEmailLoginTokenAsConsumed,
  createUserFromEmail,
  getUserByEmail,
} from "@/db/queries";
import type { UserSelect } from "@/types";

const TOKEN_BYTES = 32;
const DEFAULT_TTL_MINUTES = 15;

export const MAGIC_LINK_TOKEN_TTL_MINUTES = Math.max(
  5,
  Number(process.env.EMAIL_LOGIN_TOKEN_TTL_MINUTES ?? DEFAULT_TTL_MINUTES)
);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function issueEmailMagicLinkToken(email: string, locale?: string) {
  const normalizedEmail = normalizeEmail(email);
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TOKEN_TTL_MINUTES * 60 * 1000);

  await deleteEmailLoginTokensForEmail(normalizedEmail);

  console.log(`[auth] Creating magic link token for email: ${normalizedEmail}, hash: ${tokenHash.substring(0, 8)}..., expires: ${expiresAt}`);
  const record = await createEmailLoginTokenRecord({
    email: normalizedEmail,
    tokenHash,
    locale,
    expiresAt,
  });

  console.log(`[auth] Created token record with ID: ${record.id}`);

  return { token, expiresAt, email: normalizedEmail };
}

export type MagicLinkTokenStatusResult =
  | { status: "valid"; expiresAt: Date }
  | { status: "expired"; expiresAt: Date }
  | { status: "consumed"; consumedAt: Date }
  | { status: "not_found" }
  | { status: "email_mismatch" };

export async function consumeEmailMagicLinkToken(email: string, token: string) {
  const normalizedEmail = normalizeEmail(email);
  const tokenHash = hashToken(token);
  console.log(`[auth] Looking for magic link token with hash: ${tokenHash.substring(0, 8)}... for email: ${normalizedEmail}`);

  const record = await getEmailLoginTokenByHash(tokenHash);
  console.log(`[auth] Found token record:`, record ? {
    id: record.id,
    email: record.email,
    expiresAt: record.expiresAt,
    consumedAt: record.consumedAt
  } : 'null');

  if (!record || record.email !== normalizedEmail) {
    console.warn(`[auth] Invalid or expired magic link for ${normalizedEmail}`);
    return null;
  }

  const now = new Date();
  if (record.expiresAt && record.expiresAt < now) {
    console.warn(`[auth] Magic link expired for ${normalizedEmail}. Expired: ${record.expiresAt}, Now: ${now}`);
    await deleteEmailLoginTokenById(record.id);
    return null;
  }

  if (record.consumedAt) {
    console.warn(`[auth] Magic link already consumed for ${normalizedEmail} at ${record.consumedAt}`);
    return null;
  }

  console.log(`[auth] Successfully consuming magic link for ${normalizedEmail}`);

  await markEmailLoginTokenAsConsumed(record.id);

  return record;
}

export async function getMagicLinkTokenStatus(email: string, token: string): Promise<MagicLinkTokenStatusResult> {
  const normalizedEmail = normalizeEmail(email);
  const tokenHash = hashToken(token);

  const record = await getEmailLoginTokenByHash(tokenHash);

  if (!record) {
    console.warn(`[auth] Magic link status check failed for ${normalizedEmail}: record not found`);
    return { status: "not_found" };
  }

  if (record.email !== normalizedEmail) {
    console.warn(`[auth] Magic link token email mismatch for ${normalizedEmail}. Token belongs to ${record.email}`);
    return { status: "email_mismatch" };
  }

  const now = new Date();
  if (record.expiresAt && record.expiresAt < now) {
    console.warn(`[auth] Magic link expired for ${normalizedEmail} (status check)`);
    await deleteEmailLoginTokenById(record.id);
    return { status: "expired", expiresAt: record.expiresAt };
  }

  if (record.consumedAt) {
    console.warn(`[auth] Magic link already consumed for ${normalizedEmail} at ${record.consumedAt}`);
    return { status: "consumed", consumedAt: record.consumedAt };
  }

  return { status: "valid", expiresAt: record.expiresAt };
}

export async function resolveUserForEmail(email: string): Promise<UserSelect> {
  const normalizedEmail = normalizeEmail(email);
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    return existing;
  }

  return createUserFromEmail({
    id: `email_${randomUUID()}`,
    email: normalizedEmail,
    nickname: normalizedEmail,
    avatarUrl: undefined,
  });
}
