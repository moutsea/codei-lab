import { db, DbClient } from "../index";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { dailyApiUsage } from "@/db/schema";
import type { DailyApiUsageSelect } from "@/types/schema";

/**
 * 根据 API Key 和日期获取使用量记录
 */
export async function getDailyApiUsageByApikeyAndDate(
  apikey: string,
  date: string
): Promise<DailyApiUsageSelect | null> {
  try {
    const result = await db()
      .select()
      .from(dailyApiUsage)
      .where(and(eq(dailyApiUsage.apikey, apikey), eq(dailyApiUsage.date, date)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting daily API usage by API Key and date:", error);
    return null;
  }
}

/**
 * 使用原子性的 "UPSERT" 操作为 API Key 的每日使用量添加 tokens。
 * 如果记录已存在，则在现有 tokens 基础上增加；如果不存在，则创建新记录。
 *
 * @param apikey - API Key
 * @param date - 日期字符串 (e.g., 'YYYY-MM-DD')
 * @param inputTokens - 要添加的输入 token 数量
 * @param cachedTokens - 要添加的缓存 token 数量，默认为 0
 * @param outputTokens - 要添加的输出 token 数量，默认为 0
 * @param quotaUsed - 要添加的配额使用量，默认为 0
 * @param dbInstance - 数据库实例，默认使用默认的 db()
 * @returns 更新或创建后的每日使用记录
 */
export async function addTokensToDailyApiUsage(
  apikey: string,
  date: string,
  inputTokens: number,
  cachedTokens: number = 0,
  outputTokens: number = 0,
  quotaUsed: number = 0,
  dbInstance: DbClient = db()
): Promise<DailyApiUsageSelect> {
  const [usage] = await dbInstance
    .insert(dailyApiUsage)
    .values({
      apikey,
      date,
      inputTokens,
      cachedTokens,
      outputTokens,
      quotaUsed: String(quotaUsed),
      // `updatedAt` 也会在插入时设置
      updatedAt: new Date(),
    })
    // 关键部分：定义冲突处理逻辑
    .onConflictDoUpdate({
      // 告诉数据库当 `apikey` 和 `date` 的组合已存在时，视为冲突
      target: [dailyApiUsage.apikey, dailyApiUsage.date],
      // 定义冲突时要更新的字段
      set: {
        // 使用 sql`` 模板字符串来执行数据库层面的计算，避免竞态条件
        inputTokens: sql`${dailyApiUsage.inputTokens} + ${inputTokens}`,
        cachedTokens: sql`${dailyApiUsage.cachedTokens} + ${cachedTokens}`,
        outputTokens: sql`${dailyApiUsage.outputTokens} + ${outputTokens}`,
        quotaUsed: sql`${dailyApiUsage.quotaUsed} + ${quotaUsed}`,
        updatedAt: new Date(),
      },
    })
    // 将最终（无论是插入还是更新）的行数据返回
    .returning();

  return usage;
}

/**
 * 根据 API Key 获取每日使用量列表（支持日期范围过滤）
 */
export async function getDailyApiUsageByApikey(
  apikey: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100,
  offset: number = 0
): Promise<DailyApiUsageSelect[]> {
  try {
    let whereConditions = [eq(dailyApiUsage.apikey, apikey)];

    // 添加日期范围过滤
    if (startDate) {
      whereConditions.push(gte(dailyApiUsage.date, startDate));
    }

    if (endDate) {
      whereConditions.push(lte(dailyApiUsage.date, endDate));
    }

    const result = await db()
      .select()
      .from(dailyApiUsage)
      .where(and(...whereConditions))
      .orderBy(dailyApiUsage.date)
      .limit(limit)
      .offset(offset);

    return result;
  } catch (error) {
    console.error("Error getting daily API usage by API Key:", error);
    return [];
  }
}

/**
 * 根据 API Key 获取使用量统计
 */
export async function getDailyApiUsageStatsByApikey(
  apikey: string,
  startDate?: string,
  endDate?: string
): Promise<{
  totalInputTokens: number;
  totalCachedTokens: number;
  totalOutputTokens: number;
  totalQuotaUsed: string;
  recordCount: number;
}> {
  try {
    let conditions = [eq(dailyApiUsage.apikey, apikey)];

    // 添加日期范围过滤
    if (startDate) {
      conditions.push(gte(dailyApiUsage.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(dailyApiUsage.date, endDate));
    }

    const result = await db()
      .select({
        totalInputTokens: sql<number>`SUM(${dailyApiUsage.inputTokens})`,
        totalCachedTokens: sql<number>`SUM(${dailyApiUsage.cachedTokens})`,
        totalOutputTokens: sql<number>`SUM(${dailyApiUsage.outputTokens})`,
        totalQuotaUsed: sql<string>`SUM(${dailyApiUsage.quotaUsed})`,
        recordCount: sql<number>`COUNT(*)`,
      })
      .from(dailyApiUsage)
      .where(and(...conditions))
      .limit(1);

    if (result && result.length > 0) {
      return {
        totalInputTokens: Number(result[0].totalInputTokens) || 0,
        totalCachedTokens: Number(result[0].totalCachedTokens) || 0,
        totalOutputTokens: Number(result[0].totalOutputTokens) || 0,
        totalQuotaUsed: result[0].totalQuotaUsed || "0",
        recordCount: Number(result[0].recordCount) || 0,
      };
    }

    return {
      totalInputTokens: 0,
      totalCachedTokens: 0,
      totalOutputTokens: 0,
      totalQuotaUsed: "0",
      recordCount: 0,
    };
  } catch (error) {
    console.error("Error getting daily API usage stats by API Key:", error);
    return {
      totalInputTokens: 0,
      totalCachedTokens: 0,
      totalOutputTokens: 0,
      totalQuotaUsed: "0",
      recordCount: 0,
    };
  }
}

/**
 * 删除指定日期之前的记录（用于数据清理）
 */
export async function deleteDailyApiUsageBeforeDate(
  beforeDate: string
): Promise<number> {
  try {
    const result = await db()
      .delete(dailyApiUsage)
      .where(lte(dailyApiUsage.date, beforeDate))
      .returning();

    return result.length;
  } catch (error) {
    console.error("Error deleting daily API usage before date:", error);
    return 0;
  }
}

/**
 * 删除指定 API Key 的所有记录
 */
export async function deleteDailyApiUsageByApikey(apikey: string): Promise<number> {
  try {
    const result = await db()
      .delete(dailyApiUsage)
      .where(eq(dailyApiUsage.apikey, apikey))
      .returning();

    return result.length;
  } catch (error) {
    console.error("Error deleting daily API usage by API Key:", error);
    return 0;
  }
}

/**
 * 获取所有 API Key 的使用量汇总（按日期排序）
 */
export async function getAllDailyApiUsage(
  startDate?: string,
  endDate?: string,
  limit: number = 1000,
  offset: number = 0
): Promise<DailyApiUsageSelect[]> {
  try {
    let whereConditions = [];

    // 添加日期范围过滤
    if (startDate && endDate) {
      whereConditions.push(
        and(gte(dailyApiUsage.date, startDate), lte(dailyApiUsage.date, endDate))
      );
    } else if (startDate) {
      whereConditions.push(gte(dailyApiUsage.date, startDate));
    } else if (endDate) {
      whereConditions.push(lte(dailyApiUsage.date, endDate));
    }

    const result = await db()
      .select()
      .from(dailyApiUsage)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(dailyApiUsage.date)
      .limit(limit)
      .offset(offset);

    return result;
  } catch (error) {
    console.error("Error getting all daily API usage:", error);
    return [];
  }
}

/**
 * 获取每日 API 使用量排行榜（按配额使用量排序）
 */
export async function getTopDailyApiUsageByQuota(
  date: string,
  limit: number = 50
): Promise<(DailyApiUsageSelect & { rank?: number })[]> {
  try {
    const result = await db()
      .select()
      .from(dailyApiUsage)
      .where(eq(dailyApiUsage.date, date))
      .orderBy(dailyApiUsage.quotaUsed)
      .limit(limit);

    return result.map((record, index) => ({
      ...record,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("Error getting top daily API usage by quota:", error);
    return [];
  }
}

/**
 * 直接更新每日 API 使用量（不增加，而是替换为指定值）
 */
export async function updateDailyApiUsage(
  apikey: string,
  date: string,
  data: {
    inputTokens?: number;
    cachedTokens?: number;
    outputTokens?: number;
    quotaUsed?: string;
  }
): Promise<DailyApiUsageSelect | null> {
  try {
    const updated = await db()
      .update(dailyApiUsage)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(dailyApiUsage.apikey, apikey), eq(dailyApiUsage.date, date)))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error("Error updating daily API usage:", error);
    return null;
  }
}

/**
 * 检查指定 API Key 和日期的记录是否存在
 */
export async function dailyApiUsageExists(
  apikey: string,
  date: string
): Promise<boolean> {
  try {
    const result = await db()
      .select({ count: sql<number>`COUNT(*)` })
      .from(dailyApiUsage)
      .where(and(eq(dailyApiUsage.apikey, apikey), eq(dailyApiUsage.date, date)))
      .limit(1);

    return (result[0]?.count || 0) > 0;
  } catch (error) {
    console.error("Error checking daily API usage existence:", error);
    return false;
  }
}