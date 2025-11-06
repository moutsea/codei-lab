import { db, DbClient } from "../index";
import { monthlyApiUsage, apiKeys } from "../schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import type { MonthlyApiUsageInsert, MonthlyApiUsageSelect } from "../schema";

export interface MonthlyApiUsageWithName extends Omit<MonthlyApiUsageSelect, 'id'> {
  apiKeyId: number;
  apiKeyName: string;
  requestLimit: number | null;
}

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

/**
 * Create or update monthly API usage (upsert operation)
 */
export async function upsertMonthlyApiUsage(
  apiKey: string,
  month: string,
  tokens: number
): Promise<MonthlyApiUsageSelect> {
  // First try to find existing record
  const existing = await getMonthlyApiUsageByKeyAndMonth(apiKey, month);

  if (existing) {
    // Update existing record
    return await updateMonthlyApiUsageTokens(existing.id, existing.totalTokens + tokens) as MonthlyApiUsageSelect;
  } else {
    // Create new record
    return await createMonthlyApiUsage({
      apikey: apiKey,
      month,
      totalTokens: tokens,
    }) as MonthlyApiUsageSelect;
  }
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
        totalTokens: monthlyApiUsage.totalTokens,
        updatedAt: monthlyApiUsage.updatedAt,
        apiKeyId: apiKeys.id,
        apiKeyName: apiKeys.name,
        requestLimit: apiKeys.requestLimit
      })
      .from(monthlyApiUsage)
      .innerJoin(apiKeys, eq(monthlyApiUsage.apikey, apiKeys.key))
      .where(and(...whereConditions, eq(apiKeys.userId, userId)))
      .orderBy(desc(monthlyApiUsage.totalTokens));
  } else {
    return await db()
      .select({
        apikey: monthlyApiUsage.apikey,
        month: monthlyApiUsage.month,
        totalTokens: monthlyApiUsage.totalTokens,
        updatedAt: monthlyApiUsage.updatedAt,
        apiKeyId: apiKeys.id,
        apiKeyName: apiKeys.name,
        requestLimit: apiKeys.requestLimit
      })
      .from(monthlyApiUsage)
      .innerJoin(apiKeys, eq(monthlyApiUsage.apikey, apiKeys.key))
      .where(and(...whereConditions))
      .orderBy(desc(monthlyApiUsage.totalTokens));
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
  totalTokens: number
): Promise<MonthlyApiUsageSelect | null> {
  const [usage] = await db()
    .update(monthlyApiUsage)
    .set({
      totalTokens,
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
  tokens: number,
  dbInstance: DbClient = db()
): Promise<MonthlyApiUsageSelect | null> {
  // 1. 在数据库中原子性地执行 Upsert 操作
  const [updatedUsage] = await dbInstance
    .insert(monthlyApiUsage)
    .values({
      apikey: apiKey,
      month: month,
      totalTokens: tokens,
    })
    .onConflictDoUpdate({
      target: [monthlyApiUsage.apikey, monthlyApiUsage.month],
      set: {
        totalTokens: sql`${monthlyApiUsage.totalTokens} + ${tokens}`,
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
 * Get top monthly usage months for an API key
 */
export async function getTopMonthlyUsageMonths(
  apiKey: string,
  limit: number = 12,
  startMonth?: string,
  endMonth?: string
): Promise<MonthlyApiUsageSelect[]> {
  const whereConditions = [eq(monthlyApiUsage.apikey, apiKey)];

  if (startMonth) {
    whereConditions.push(gte(monthlyApiUsage.month, startMonth));
  }
  if (endMonth) {
    whereConditions.push(lte(monthlyApiUsage.month, endMonth));
  }

  return await db()
    .select()
    .from(monthlyApiUsage)
    .where(and(...whereConditions))
    .orderBy(desc(monthlyApiUsage.totalTokens))
    .limit(limit);
}

/**
 * Get total tokens used across all API keys
 */
export async function getTotalTokensUsed(): Promise<number> {
  const [result] = await db()
    .select({ total: sql<number>`COALESCE(SUM(${monthlyApiUsage.totalTokens}), 0)` })
    .from(monthlyApiUsage);

  return Number(result.total) || 0;
}

/**
 * Get tokens used in current month
 */
export async function getTokensUsedThisMonth(): Promise<number> {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-1`;

  const [result] = await db()
    .select({ total: sql<number>`COALESCE(SUM(${monthlyApiUsage.totalTokens}), 0)` })
    .from(monthlyApiUsage)
    .where(gte(monthlyApiUsage.month, currentMonth));

  return Number(result.total) || 0;
}
