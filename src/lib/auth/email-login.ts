import { randomBytes, createHash, randomUUID } from "crypto";
import {
  createEmailLoginTokenRecord,
  deleteEmailLoginTokenById,
  deleteEmailLoginTokensForEmail,
  deleteExpiredEmailLoginTokens,
  getEmailLoginTokenByHash,
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

  await deleteExpiredEmailLoginTokens();
  await deleteEmailLoginTokensForEmail(normalizedEmail);

  await createEmailLoginTokenRecord({
    email: normalizedEmail,
    tokenHash,
    locale,
    expiresAt,
  });

  return { token, expiresAt, email: normalizedEmail };
}

export async function consumeEmailMagicLinkToken(email: string, token: string) {
  const normalizedEmail = normalizeEmail(email);
  const tokenHash = hashToken(token);
  const record = await getEmailLoginTokenByHash(tokenHash);

  if (!record || record.email !== normalizedEmail) {
    return null;
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    await deleteEmailLoginTokenById(record.id);
    return null;
  }

  await deleteEmailLoginTokenById(record.id);
  return record;
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
    avatarUrl: null,
  });
}
