import { db } from "../index";
import { emailLoginTokens } from "../schema";
import type { EmailLoginTokenInsert, EmailLoginTokenSelect } from "@/types";
import { eq, lt } from "drizzle-orm";

export async function createEmailLoginTokenRecord(data: EmailLoginTokenInsert): Promise<EmailLoginTokenSelect> {
  const [record] = await db().insert(emailLoginTokens).values(data).returning();
  return record;
}

export async function getEmailLoginTokenByHash(tokenHash: string): Promise<EmailLoginTokenSelect | null> {
  const [record] = await db()
    .select()
    .from(emailLoginTokens)
    .where(eq(emailLoginTokens.tokenHash, tokenHash))
    .limit(1);
  return record ?? null;
}

export async function deleteEmailLoginTokenById(id: number): Promise<void> {
  await db().delete(emailLoginTokens).where(eq(emailLoginTokens.id, id));
}

export async function deleteEmailLoginTokensForEmail(email: string): Promise<void> {
  await db().delete(emailLoginTokens).where(eq(emailLoginTokens.email, email));
}

export async function deleteExpiredEmailLoginTokens(currentDate: Date = new Date()): Promise<void> {
  await db().delete(emailLoginTokens).where(lt(emailLoginTokens.expiresAt, currentDate));
}

export async function markEmailLoginTokenAsConsumed(id: number): Promise<void> {
  await db()
    .update(emailLoginTokens)
    .set({ consumedAt: new Date() })
    .where(eq(emailLoginTokens.id, id));
}
