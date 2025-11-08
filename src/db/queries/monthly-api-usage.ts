import { db, DbClient } from "../index";
import { monthlyApiUsage, apiKeys } from "../schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import type { MonthlyApiUsageInsert, MonthlyApiUsageSelect } from "@/types";
import { currentCycle } from "@/lib/utils";
import type { MonthlyApiUsageWithName } from "@/types/db";

// ========== Create Operations ==========

/**
 * Create a new monthly API usage record
 */
export async function createMonthlyApiUsage(data: Omit<MonthlyApiUsageInsert, 'id' | 'updatedAt'>) {
  const [usage] = await db().insert(monthlyApiUsage).values({
    ...data,
    updatedAt: new Date(),
  }).returning();
  return usage;
}

// ========== Read Operations ==========

/**
 * Get monthly API usage by ID
 */
export async function getMonthlyApiUsageById(id: number): Promise<MonthlyApiUsageSelect | null> {
  const [usage] = await db().select().from(monthlyApiUsage).where(eq(monthlyApiUsage.id, id)).limit(1);
  return usage || null;
}

/**
 * Get monthly API usage by API key and month
 */
export async function getMonthlyApiUsageByKeyAndMonth(
  apiKey: string,
  month: string
): Promise<MonthlyApiUsageSelect | null> {
  const [usage] = await db()
    .select()
    .from(monthlyApiUsage)
    .where(and(
      eq(monthlyApiUsage.apikey, apiKey),
      eq(monthlyApiUsage.month, month)
    ))
    .limit(1);
  return usage || null;
}

/**
 * Get all API keys usage for a specific month
 */
export async function getApiKeysUsageByMonth(
  month: string,
  userId?: string
): Promise<MonthlyApiUsageWithName[]> {
  const whereConditions = [eq(monthlyApiUsage.month, month)];

  if (userId) {
    return await db()
      .select({
        apikey: monthlyApiUsage.apikey,
        month: monthlyApiUsage.month,
        inputTokens: monthlyApiUsage.inputTokens,
        cachedTokens: monthlyApiUsage.cachedTokens,
        outputTokens: monthlyApiUsage.outputTokens,
        quotaUsed: monthlyApiUsage.quotaUsed,
        updatedAt: monthlyApiUsage.updatedAt,
        apiKeyId: apiKeys.id,
        apiKeyName: apiKeys.name,
        quotaLimit: apiKeys.quota
      })
      .from(monthlyApiUsage)
      .innerJoin(apiKeys, eq(monthlyApiUsage.apikey, apiKeys.key))
      .where(and(...whereConditions, eq(apiKeys.userId, userId)))
      .orderBy(desc(sql`(inputTokens + cachedTokens + outputTokens)`));
  } else {
    return await db()
      .select({
        apikey: monthlyApiUsage.apikey,
        month: monthlyApiUsage.month,
        inputTokens: monthlyApiUsage.inputTokens,
        cachedTokens: monthlyApiUsage.cachedTokens,
        outputTokens: monthlyApiUsage.outputTokens,
        quotaUsed: monthlyApiUsage.quotaUsed,
        updatedAt: monthlyApiUsage.updatedAt,
        apiKeyId: apiKeys.id,
        apiKeyName: apiKeys.name,
        quotaLimit: apiKeys.quota
      })
      .from(monthlyApiUsage)
      .innerJoin(apiKeys, eq(monthlyApiUsage.apikey, apiKeys.key))
      .where(and(...whereConditions))
      .orderBy(desc(sql`(inputTokens + cachedTokens + outputTokens)`));
  }
}

// ========== Update Operations ==========

/**
 * Update monthly API usage by ID
 */
export async function updateMonthlyApiUsageById(
  id: number,
  data: Partial<Omit<MonthlyApiUsageInsert, 'id'>>
): Promise<MonthlyApiUsageSelect | null> {
  const [usage] = await db()
    .update(monthlyApiUsage)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(monthlyApiUsage.id, id))
    .returning();
  return usage || null;
}

/**
 * Update tokens for a monthly API usage record
 */
export async function updateMonthlyApiUsageTokens(
  id: number,
  inputTokens: number,
  cachedTokens: number = 0,
  outputTokens: number = 0
): Promise<MonthlyApiUsageSelect | null> {
  const [usage] = await db()
    .update(monthlyApiUsage)
    .set({
      inputTokens,
      cachedTokens,
      outputTokens,
      updatedAt: new Date()
    })
    .where(eq(monthlyApiUsage.id, id))
    .returning();
  return usage || null;
}

/**
 * Add tokens to a monthly API usage record
 */
export async function addTokensToMonthlyApiUsage(
  apiKey: string,
  month: string,
  inputTokens: number,
  cachedTokens: number = 0,
  outputTokens: number = 0,
  quotaUsed: number = 0,
  dbInstance: DbClient = db()
): Promise<MonthlyApiUsageSelect | null> {
  // 1. 在数据库中原子性地执行 Upsert 操作
  const [updatedUsage] = await dbInstance
    .insert(monthlyApiUsage)
    .values({
      apikey: apiKey,
      month: month,
      inputTokens,
      cachedTokens,
      outputTokens,
      quotaUsed: String(quotaUsed),
    })
    .onConflictDoUpdate({
      target: [monthlyApiUsage.apikey, monthlyApiUsage.month],
      set: {
        inputTokens: sql`${monthlyApiUsage.inputTokens} + ${inputTokens}`,
        cachedTokens: sql`${monthlyApiUsage.cachedTokens} + ${cachedTokens}`,
        outputTokens: sql`${monthlyApiUsage.outputTokens} + ${outputTokens}`,
        quotaUsed: sql`${monthlyApiUsage.quotaUsed} + ${quotaUsed}`,
      },
    })
    .returning();

  return updatedUsage;
}

// ========== Delete Operations ==========

/**
 * Delete monthly API usage by ID
 */
export async function deleteMonthlyApiUsageById(id: number): Promise<MonthlyApiUsageSelect | null> {
  const [usage] = await db()
    .delete(monthlyApiUsage)
    .where(eq(monthlyApiUsage.id, id))
    .returning();
  return usage || null;
}

/**
 * Delete monthly API usage for a specific month range
 */
export async function deleteMonthlyApiUsageByMonthRange(
  apiKey: string,
  startMonth: string,
  endMonth: string
): Promise<MonthlyApiUsageSelect[]> {
  return await db()
    .delete(monthlyApiUsage)
    .where(and(
      eq(monthlyApiUsage.apikey, apiKey),
      gte(monthlyApiUsage.month, startMonth),
      lte(monthlyApiUsage.month, endMonth)
    ))
    .returning();
}

/**
 * Delete all monthly usage records for an API key
 */
export async function deleteAllMonthlyApiUsageByApiKey(apiKey: string): Promise<MonthlyApiUsageSelect[]> {
  return await db()
    .delete(monthlyApiUsage)
    .where(eq(monthlyApiUsage.apikey, apiKey))
    .returning();
}

/**
 * Delete all monthly usage records for a user
 */
export async function deleteAllMonthlyApiUsageByUserId(userId: string): Promise<MonthlyApiUsageSelect[]> {
  return await db()
    .delete(monthlyApiUsage)
    .where(sql`${monthlyApiUsage.apikey} IN (
      SELECT ${apiKeys.key} FROM ${apiKeys} WHERE ${apiKeys.userId} = ${userId}
    )`)
    .returning();
}

/**
 * Get total tokens used across all API keys
 */
export async function getTotalTokensUsed(): Promise<{
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
}> {
  const [result] = await db()
    .select({
      inputTokens: sql<number>`COALESCE(SUM(${monthlyApiUsage.inputTokens}), 0)`,
      cachedTokens: sql<number>`COALESCE(SUM(${monthlyApiUsage.cachedTokens}), 0)`,
      outputTokens: sql<number>`COALESCE(SUM(${monthlyApiUsage.outputTokens}), 0)`
    })
    .from(monthlyApiUsage);

  return {
    inputTokens: Number(result.inputTokens) || 0,
    cachedTokens: Number(result.cachedTokens) || 0,
    outputTokens: Number(result.outputTokens) || 0
  };
}

/**
 * Get tokens used in current month
 */
export async function getTokensUsedThisMonth(): Promise<number> {
  const currentMonth = currentCycle();
  const [result] = await db()
    .select({
      total: sql<number>`COALESCE(SUM(${monthlyApiUsage.inputTokens} + ${monthlyApiUsage.cachedTokens} + ${monthlyApiUsage.outputTokens}), 0)`
    })
    .from(monthlyApiUsage)
    .where(gte(monthlyApiUsage.month, currentMonth));
  return Number(result.total) || 0;
}

/**
 * Get total quota used across all API keys
 */
export async function getTotalQuotaUsed(): Promise<number> {
  const [result] = await db()
    .select({
      total: sql<number>`COALESCE(SUM(${monthlyApiUsage.quotaUsed}), 0)`
    })
    .from(monthlyApiUsage);

  return Number(result.total) || 0;
}

/**
 * Get quota used in current month
 */
export async function getQuotaUsedThisMonth(): Promise<number> {
  const currentMonth = currentCycle();
  const [result] = await db()
    .select({
      total: sql<number>`COALESCE(SUM(${monthlyApiUsage.quotaUsed}), 0)`
    })
    .from(monthlyApiUsage)
    .where(gte(monthlyApiUsage.month, currentMonth));

  return Number(result.total) || 0;
}
