import { db, DbClient } from "../index";
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
    data: Partial<Omit<TopUpPurchaseInsert, 'id' | 'createdAt'>>,
    dbInstance: DbClient = db()
): Promise<TopUpPurchaseSelect | null> {
    const [topUpPurchase] = await dbInstance
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


// ========== Delete Operations ==========

/**
 * Delete top-up purchase by ID
 */
export async function deleteTopUpPurchase(id: number, dbInstance: DbClient = db()): Promise<TopUpPurchaseSelect | null> {
    const [topUpPurchase] = await dbInstance
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

/**
 * Consume quota from the most recent active top-up purchase for a user
 * @param userId - The user ID to consume quota from
 * @param quotaToConsume - The amount of quota to consume (number)
 * @returns Promise<boolean> - true if quota was consumed, false if no active top-up found
 */
export async function consumeTopUpQuota(userId: string, quotaToConsume: number, dbInstance: DbClient = db()): Promise<boolean> {
    try {
        // 获取最新的 active top-up 记录
        const [topUp] = await getTopUpPurchasesByUserId(userId); // 解构取第一个元素

        if (!topUp) {
            // 没有找到 active top-up
            return false;
        }

        const currentQuota = parseFloat(topUp.quota.toString()); // 确保 quota 是数字类型

        if (currentQuota < quotaToConsume) {
            await deleteTopUpPurchase(topUp.id, dbInstance);
        } else {
            const newQuota = Math.max(0, currentQuota - quotaToConsume); // 保证不为负数
            await updateTopUpPurchase(topUp.id, {
                quota: newQuota.toString(),
                status: topUp.status
            }, dbInstance);
        }

        return true;
    } catch (error) {
        console.error('Error consuming top-up quota:', error);
        throw error;
    }
}
