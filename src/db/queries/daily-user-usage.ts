import { db, DbClient } from "../index";
import { dailyUserUsage } from "../schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { DailyUserUsageInsert, DailyUserUsageSelect } from "../schema";

// ========== Create Operations ==========

/**
 * Create a new daily user usage record
 */
export async function createDailyUserUsage(data: Omit<DailyUserUsageInsert, 'id' | 'updatedAt'>) {
  const [usage] = await db().insert(dailyUserUsage).values({
    ...data,
    updatedAt: new Date(),
  }).returning();
  return usage;
}

/**
 * Create or update daily user usage (upsert operation)
 */
export async function upsertDailyUserUsage(
  userId: string,
  date: string,
  tokens: number
): Promise<DailyUserUsageSelect> {
  // First try to find existing record
  const existing = await getDailyUserUsageByUserAndDate(userId, date);

  if (existing) {
    // Update existing record
    return await updateDailyUserUsageTokens(existing.id, existing.totalTokens + tokens) as DailyUserUsageSelect;
  } else {
    // Create new record
    return await createDailyUserUsage({
      userId,
      date,
      totalTokens: tokens,
    }) as DailyUserUsageSelect;
  }
}

// ========== Read Operations ==========

/**
 * Get daily user usage by ID
 */
export async function getDailyUserUsageById(id: number): Promise<DailyUserUsageSelect | null> {
  const [usage] = await db().select().from(dailyUserUsage).where(eq(dailyUserUsage.id, id)).limit(1);
  return usage || null;
}

/**
 * Get daily user usage by user ID and date
 */
export async function getDailyUserUsageByUserAndDate(
  userId: string,
  date: string
): Promise<DailyUserUsageSelect | null> {
  const [usage] = await db()
    .select()
    .from(dailyUserUsage)
    .where(and(
      eq(dailyUserUsage.userId, userId),
      eq(dailyUserUsage.date, date)
    ))
    .limit(1);
  return usage || null;
}


/**
 * Get daily usage for a specific date range
 */
export async function getDailyUserUsageByDateRange(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<DailyUserUsageSelect[]> {
  const whereConditions = [
    gte(dailyUserUsage.date, startDate),
    lte(dailyUserUsage.date, endDate)
  ];

  if (userId) {
    whereConditions.push(eq(dailyUserUsage.userId, userId));
  }

  return await db()
    .select()
    .from(dailyUserUsage)
    .where(and(...whereConditions))
    .orderBy(dailyUserUsage.date);
}



// ========== Update Operations ==========

/**
 * Update daily user usage by ID
 */
export async function updateDailyUserUsageById(
  id: number,
  data: Partial<Omit<DailyUserUsageInsert, 'id'>>
): Promise<DailyUserUsageSelect | null> {
  const [usage] = await db()
    .update(dailyUserUsage)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(dailyUserUsage.id, id))
    .returning();
  return usage || null;
}

/**
 * Update tokens for a daily usage record
 */
export async function updateDailyUserUsageTokens(
  id: number,
  totalTokens: number
): Promise<DailyUserUsageSelect | null> {
  const [usage] = await db()
    .update(dailyUserUsage)
    .set({
      totalTokens,
      updatedAt: new Date()
    })
    .where(eq(dailyUserUsage.id, id))
    .returning();
  return usage || null;
}

/**
 * 使用原子性的 "UPSERT" 操作为用户的每日使用量添加 tokens。
 * 如果记录已存在，则在现有 tokens 基础上增加；如果不存在，则创建新记录。
 *
 * @param userId - 用户 ID
 * @param date - 日期字符串 (e.g., 'YYYY-MM-DD')
 * @param tokens - 要添加的 token 数量
 * @returns 更新或创建后的每日使用记录
 */
export async function addTokensToDailyUsage(
  userId: string,
  date: string,
  tokens: number,
  dbInstance: DbClient = db()
): Promise<DailyUserUsageSelect> {
  const [usage] = await dbInstance
    .insert(dailyUserUsage)
    .values({
      userId,
      date,
      totalTokens: tokens,
      // `updatedAt` 也会在插入时设置
      updatedAt: new Date(),
    })
    // 关键部分：定义冲突处理逻辑
    .onConflictDoUpdate({
      // 告诉数据库当 `userId` 和 `date` 的组合已存在时，视为冲突
      target: [dailyUserUsage.userId, dailyUserUsage.date],
      // 定义冲突时要更新的字段
      set: {
        // 使用 sql`` 模板字符串来执行数据库层面的计算，避免竞态条件
        totalTokens: sql`${dailyUserUsage.totalTokens} + ${tokens}`,
        updatedAt: new Date(),
      },
    })
    // 将最终（无论是插入还是更新）的行数据返回
    .returning();

  return usage;
}

// ========== Delete Operations ==========

/**
 * Delete daily user usage by ID
 */
export async function deleteDailyUserUsageById(id: number): Promise<DailyUserUsageSelect | null> {
  const [usage] = await db()
    .delete(dailyUserUsage)
    .where(eq(dailyUserUsage.id, id))
    .returning();
  return usage || null;
}

/**
 * Delete daily user usage for a specific date range
 */
export async function deleteDailyUserUsageByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyUserUsageSelect[]> {
  return await db()
    .delete(dailyUserUsage)
    .where(and(
      eq(dailyUserUsage.userId, userId),
      gte(dailyUserUsage.date, startDate),
      lte(dailyUserUsage.date, endDate)
    ))
    .returning();
}

/**
 * Delete all daily usage records for a user
 */
export async function deleteAllDailyUserUsageByUserId(userId: string): Promise<DailyUserUsageSelect[]> {
  return await db()
    .delete(dailyUserUsage)
    .where(eq(dailyUserUsage.userId, userId))
    .returning();
}
