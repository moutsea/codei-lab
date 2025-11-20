import { db } from "../index";
import { topUpPurchases, users } from "../schema";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import type { TopUpPurchaseInsert, TopUpPurchaseSelect } from "@/types";

// ========== Create Operations ==========

/**
 * Create a new top-up purchase record
 */
export async function createTopUpPurchase(data: Omit<TopUpPurchaseInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<TopUpPurchaseSelect | null> {
    const [topUpPurchase] = await db()
        .insert(topUpPurchases)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();
    return topUpPurchase;
}

/**
 * Create a top-up purchase from checkout session
 */
export async function createTopUpPurchaseFromCheckout(data: {
    userId: string;
    quota: string;
    status?: string;
    endDate?: Date;
}): Promise<TopUpPurchaseSelect | null> {
    const [topUpPurchase] = await db()
        .insert(topUpPurchases)
        .values({
            ...data,
            status: data.status || 'active',
            startDate: new Date(),
            endDate: data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();
    return topUpPurchase;
}

// ========== Read Operations ==========

/**
 * Get top-up purchase by ID
 */
export async function getTopUpPurchaseById(id: number): Promise<TopUpPurchaseSelect | null> {
    const [topUpPurchase] = await db()
        .select()
        .from(topUpPurchases)
        .where(eq(topUpPurchases.id, id))
        .limit(1);
    return topUpPurchase || null;
}

/**
 * Get the most recent valid top-up purchase by user ID
 */
export async function getTopUpPurchasesByUserId(userId: string): Promise<TopUpPurchaseSelect[]> {
    const now = new Date();

    return await db()
        .select()
        .from(topUpPurchases)
        .where(
            and(
                eq(topUpPurchases.userId, userId),
                eq(topUpPurchases.status, 'active'),
                gte(topUpPurchases.endDate, now)
            )
        )
        .orderBy(desc(topUpPurchases.createdAt))
        .limit(1);
}

/**
 * Get active top-up purchases by user ID
 */
export async function getActiveTopUpPurchasesByUserId(userId: string): Promise<TopUpPurchaseSelect[]> {
    return await db()
        .select()
        .from(topUpPurchases)
        .where(
            and(
                eq(topUpPurchases.userId, userId),
                eq(topUpPurchases.status, 'active'),
                gte(topUpPurchases.endDate, new Date())
            )
        )
        .orderBy(desc(topUpPurchases.createdAt));
}

/**
 * Get top-up purchases by status
 */
export async function getTopUpPurchasesByStatus(status: string): Promise<TopUpPurchaseSelect[]> {
    return await db()
        .select()
        .from(topUpPurchases)
        .where(eq(topUpPurchases.status, status))
        .orderBy(desc(topUpPurchases.createdAt));
}

/**
 * Get top-up purchases by date range
 */
export async function getTopUpPurchasesByDateRange(
    startDate: Date,
    endDate: Date
): Promise<TopUpPurchaseSelect[]> {
    return await db()
        .select()
        .from(topUpPurchases)
        .where(
            and(
                gte(topUpPurchases.startDate, startDate),
                lte(topUpPurchases.startDate, endDate)
            )
        )
        .orderBy(desc(topUpPurchases.createdAt));
}

/**
 * Get total top-up quota for a user (sum of active purchases)
 */
export async function getTotalTopUpQuotaForUser(userId: string): Promise<string> {
    const [result] = await db()
        .select({
            totalQuota: sql<string>`SUM(CAST(${topUpPurchases.quota} AS NUMERIC))`
        })
        .from(topUpPurchases)
        .where(
            and(
                eq(topUpPurchases.userId, userId),
                eq(topUpPurchases.status, 'active'),
                gte(topUpPurchases.endDate, new Date())
            )
        );

    return result?.totalQuota || "0";
}

/**
 * Get expired top-up purchases (for cleanup)
 */
export async function getExpiredTopUpPurchases(): Promise<TopUpPurchaseSelect[]> {
    return await db()
        .select()
        .from(topUpPurchases)
        .where(
            and(
                eq(topUpPurchases.status, 'active'),
                lte(topUpPurchases.endDate, new Date())
            )
        );
}

// ========== Update Operations ==========

/**
 * Update top-up purchase by ID
 */
export async function updateTopUpPurchase(
    id: number,
    data: Partial<Omit<TopUpPurchaseInsert, 'id' | 'createdAt'>>
): Promise<TopUpPurchaseSelect | null> {
    const [topUpPurchase] = await db()
        .update(topUpPurchases)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(topUpPurchases.id, id))
        .returning();
    return topUpPurchase || null;
}

/**
 * Update top-up purchase status
 */
export async function updateTopUpPurchaseStatus(
    id: number,
    status: string
): Promise<TopUpPurchaseSelect | null> {
    const [topUpPurchase] = await db()
        .update(topUpPurchases)
        .set({
            status,
            updatedAt: new Date(),
        })
        .where(eq(topUpPurchases.id, id))
        .returning();
    return topUpPurchase || null;
}

/**
 * Extend top-up purchase end date
 */
export async function extendTopUpPurchaseEndDate(
    id: number,
    additionalDays: number
): Promise<TopUpPurchaseSelect | null> {
    const currentPurchase = await getTopUpPurchaseById(id);
    if (!currentPurchase || !currentPurchase.endDate) {
        return null;
    }

    const newEndDate = new Date(currentPurchase.endDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    const [topUpPurchase] = await db()
        .update(topUpPurchases)
        .set({
            endDate: newEndDate,
            updatedAt: new Date(),
        })
        .where(eq(topUpPurchases.id, id))
        .returning();
    return topUpPurchase || null;
}

/**
 * Mark expired top-up purchases as inactive
 */
export async function markExpiredTopUpPurchasesAsInactive(): Promise<TopUpPurchaseSelect[]> {
    const expiredPurchases = await getExpiredTopUpPurchases();

    if (expiredPurchases.length === 0) {
        return [];
    }

    return await db()
        .update(topUpPurchases)
        .set({
            status: 'expired',
            updatedAt: new Date(),
        })
        .where(eq(topUpPurchases.id, sql<number>`ANY(${expiredPurchases.map(p => p.id)})`))
        .returning();
}

// ========== Delete Operations ==========

/**
 * Delete top-up purchase by ID
 */
export async function deleteTopUpPurchase(id: number): Promise<TopUpPurchaseSelect | null> {
    const [topUpPurchase] = await db()
        .delete(topUpPurchases)
        .where(eq(topUpPurchases.id, id))
        .returning();
    return topUpPurchase || null;
}

/**
 * Delete top-up purchases by user ID (bulk delete)
 */
export async function deleteTopUpPurchasesByUserId(userId: string): Promise<TopUpPurchaseSelect[]> {
    return await db()
        .delete(topUpPurchases)
        .where(eq(topUpPurchases.userId, userId))
        .returning();
}

// ========== Utility Operations ==========

/**
 * Count top-up purchases by user
 */
export async function countTopUpPurchasesByUser(userId: string): Promise<number> {
    const [result] = await db()
        .select({
            count: sql<number>`COUNT(*)`
        })
        .from(topUpPurchases)
        .where(eq(topUpPurchases.userId, userId));

    return result?.count || 0;
}

/**
 * Consume quota from the most recent active top-up purchase for a user
 * @param userId - The user ID to consume quota from
 * @param quotaToConsume - The amount of quota to consume (number)
 * @returns Promise<boolean> - true if quota was consumed, false if no active top-up found
 */
export async function consumeTopUpQuota(userId: string, quotaToConsume: number): Promise<boolean> {
    try {
        // 获取最新的 active top-up 记录
        const [topUp] = await getTopUpPurchasesByUserId(userId); // 解构取第一个元素

        if (!topUp) {
            // 没有找到 active top-up
            return false;
        }

        const currentQuota = parseFloat(topUp.quota.toString()); // 确保 quota 是数字类型
        const newQuota = Math.max(0, currentQuota - quotaToConsume); // 保证不为负数

        // 更新 top-up 记录
        await updateTopUpPurchase(topUp.id, {
            quota: newQuota.toString(),
            status: newQuota === 0 ? 'inactive' : topUp.status // quota 为 0 时标记为 inactive
        });

        return true;
    } catch (error) {
        console.error('Error consuming top-up quota:', error);
        throw error;
    }
}
