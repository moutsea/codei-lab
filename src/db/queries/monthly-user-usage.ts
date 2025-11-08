import { db, DbClient } from "../index";
import { monthlyUserUsage } from "../schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import type { MonthlyUserUsageInsert, MonthlyUserUsageSelect } from "@/types";

// ========== Create Operations ==========

/**
 * Create a new monthly user usage record
 */
export async function createMonthlyUserUsage(data: Omit<MonthlyUserUsageInsert, 'id' | 'updatedAt'>) {
  const [usage] = await db().insert(monthlyUserUsage).values({
    ...data,
    updatedAt: new Date(),
  }).returning();
  return usage;
}

/**
 * Create or update monthly user usage (upsert operation)
 */
export async function upsertMonthlyUserUsage(
  userId: string,
  month: string,
  inputTokens: number,
  cachedTokens: number = 0,
  outputTokens: number = 0
): Promise<MonthlyUserUsageSelect> {
  // First try to find existing record
  const existing = await getMonthlyUserUsageByUserAndMonth(userId, month);

  if (existing) {
    // Update existing record
    return await updateMonthlyUserUsageTokens(existing.id, existing.inputTokens + inputTokens, existing.cachedTokens + cachedTokens, existing.outputTokens + outputTokens) as MonthlyUserUsageSelect;
  } else {
    // Create new record
    return await createMonthlyUserUsage({
      userId,
      month,
      inputTokens,
      cachedTokens,
      outputTokens,
    }) as MonthlyUserUsageSelect;
  }
}

// ========== Read Operations ==========

/**
 * Get monthly user usage by user ID and month
 */
export async function getMonthlyUserUsageByUserAndMonth(
  userId: string,
  month: string
): Promise<MonthlyUserUsageSelect | null> {
  const [usage] = await db()
    .select()
    .from(monthlyUserUsage)
    .where(and(
      eq(monthlyUserUsage.userId, userId),
      eq(monthlyUserUsage.month, month)
    ))
    .limit(1);
  return usage || null;
}


/**
 * Get monthly user usage for a specific month range
 */
export async function getMonthlyUserUsageByMonthRange(
  startMonth: string,
  endMonth: string,
  userId?: string
): Promise<MonthlyUserUsageSelect[]> {
  const whereConditions = [
    gte(monthlyUserUsage.month, startMonth),
    lte(monthlyUserUsage.month, endMonth)
  ];

  if (userId) {
    whereConditions.push(eq(monthlyUserUsage.userId, userId));
  }

  return await db()
    .select()
    .from(monthlyUserUsage)
    .where(and(...whereConditions))
    .orderBy(desc(monthlyUserUsage.month));
}

/**
 * Get recent monthly user usage records
 */
export async function getRecentMonthlyUserUsage(
  userId?: string,
  limit: number = 12
): Promise<MonthlyUserUsageSelect[]> {
  const whereConditions = userId ? [eq(monthlyUserUsage.userId, userId)] : [];

  return await db()
    .select()
    .from(monthlyUserUsage)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(monthlyUserUsage.month))
    .limit(limit);
}

/**
 * Get monthly usage count for a user
 */
export async function getMonthlyUserUsageCount(
  userId: string,
  startMonth?: string,
  endMonth?: string
): Promise<number> {
  const whereConditions = [eq(monthlyUserUsage.userId, userId)];

  if (startMonth) {
    whereConditions.push(gte(monthlyUserUsage.month, startMonth));
  }
  if (endMonth) {
    whereConditions.push(lte(monthlyUserUsage.month, endMonth));
  }

  const [result] = await db()
    .select({ count: sql<number>`count(*)` })
    .from(monthlyUserUsage)
    .where(and(...whereConditions));

  return result.count;
}

/**
 * Get all users usage for a specific month
 */
export async function getUsersUsageByMonth(month: string): Promise<MonthlyUserUsageSelect[]> {
  return await db()
    .select()
    .from(monthlyUserUsage)
    .where(eq(monthlyUserUsage.month, month))
    .orderBy(desc(sql`${monthlyUserUsage.inputTokens} + ${monthlyUserUsage.cachedTokens} + ${monthlyUserUsage.outputTokens}`));
}



// ========== Update Operations ==========


/**
 * Update tokens for a monthly user usage record
 */
export async function updateMonthlyUserUsageTokens(
  id: number,
  inputTokens: number,
  cachedTokens: number = 0,
  outputTokens: number = 0
): Promise<MonthlyUserUsageSelect | null> {
  const [usage] = await db()
    .update(monthlyUserUsage)
    .set({
      inputTokens,
      cachedTokens,
      outputTokens,
      updatedAt: new Date()
    })
    .where(eq(monthlyUserUsage.id, id))
    .returning();
  return usage || null;
}

/**
 * Add tokens to a monthly user usage record
 */
export async function addTokensToMonthlyUserUsage(
  userId: string,
  month: string,
  inputTokens: number,
  cachedTokens: number = 0,
  outputTokens: number = 0,
  quotaUsed: number = 0,
  dbInstance: DbClient = db()
): Promise<MonthlyUserUsageSelect> {
  const [usage] = await dbInstance
    .insert(monthlyUserUsage)
    .values({
      userId,
      month,
      inputTokens,
      cachedTokens,
      outputTokens,
      quotaUsed: String(quotaUsed),
      updatedAt: new Date(),
    })
    // 当 `userId` 和 `month` 的组合发生冲突时，执行更新
    .onConflictDoUpdate({
      // 定义唯一性约束的字段
      target: [monthlyUserUsage.userId, monthlyUserUsage.month],
      // 定义冲突时要更新的字段和值
      set: {
        // 在数据库层面执行原子加法，避免竞态条件
        inputTokens: sql`${monthlyUserUsage.inputTokens} + ${inputTokens}`,
        cachedTokens: sql`${monthlyUserUsage.cachedTokens} + ${cachedTokens}`,
        outputTokens: sql`${monthlyUserUsage.outputTokens} + ${outputTokens}`,
        quotaUsed: sql`${monthlyUserUsage.quotaUsed} + ${quotaUsed}`,
        updatedAt: new Date(),
      },
    })
    // 返回最终插入或更新后的行
    .returning();

  return usage;
}

// ========== Delete Operations ==========

/**
 * Delete all monthly usage records for a user
 */
export async function deleteAllMonthlyUserUsageByUserId(userId: string): Promise<MonthlyUserUsageSelect[]> {
  return await db()
    .delete(monthlyUserUsage)
    .where(eq(monthlyUserUsage.userId, userId))
    .returning();
}

