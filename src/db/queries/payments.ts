import { db } from "../index";
import { payments } from "../schema";
import { eq, gte, lte, sql, and, desc, asc } from "drizzle-orm";
import type { PaymentInsert, PaymentSelect } from "@/types";

// ========== Create Operations ==========

/**
 * Create payment from Stripe payment intent
 */
export async function createPaymentFromStripe(data: {
    userId: string;
    subscriptionId: string | null;
    stripePaymentIntentId: string;
    amount: string;
    currency?: string;
    status: string;
}): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .insert(payments)
        .values({
            ...data,
            currency: data.currency || 'USD',
            createdAt: new Date(),
        })
        .returning();
    return payment;
}

// ========== Read Operations ==========

/**
 * Get payment by Stripe payment intent ID
 */
export async function getPaymentByStripePaymentIntentId(stripePaymentIntentId: string): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .select()
        .from(payments)
        .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
        .limit(1);
    return payment || null;
}

/**
 * Get payments for a user with pagination
 */
export async function getPaymentsByUserIdPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10,
    orderBy: 'createdAt' | 'amount' | 'status' | 'createdAt' = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc'
): Promise<{
    payments: PaymentSelect[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
}> {
    const offset = (page - 1) * limit;

    // Build order clause
    const orderClause = orderBy === 'createdAt'
        ? (orderDirection === 'desc' ? desc(payments.createdAt) : asc(payments.createdAt))
        : orderBy === 'amount'
        ? (orderDirection === 'desc' ? desc(payments.amount) : asc(payments.amount))
        : (orderDirection === 'desc' ? desc(payments.status) : asc(payments.status));

    const [paymentRecords, totalResult] = await Promise.all([
        db()
            .select()
            .from(payments)
            .where(eq(payments.userId, userId))
            .orderBy(orderClause)
            .limit(limit)
            .offset(offset),

        db()
            .select({
                count: sql<number>`COUNT(*)`
            })
            .from(payments)
            .where(eq(payments.userId, userId))
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
        payments: paymentRecords,
        total,
        page,
        totalPages,
        limit
    };
}

/**
 * Get payments count for a user
 */
export async function getPaymentsCountByUserId(userId: string): Promise<number> {
    const [result] = await db()
        .select({
            count: sql<number>`COUNT(*)`
        })
        .from(payments)
        .where(eq(payments.userId, userId));

    return result?.count || 0;
}

// ========== Update Operations ==========

/**
 * Update payment by Stripe payment intent ID
 */
export async function updatePaymentByStripePaymentIntentId(
    stripePaymentIntentId: string,
    data: Partial<Omit<PaymentInsert, 'id' | 'createdAt' | 'stripePaymentIntentId'>>
): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .update(payments)
        .set({
            ...data,
        })
        .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
        .returning();
    return payment || null;
}

// ========== Analytics Operations ==========

/**
 * Get total revenue from successful payments
 */
export async function getTotalRevenue(options: {
    startDate?: Date;
    endDate?: Date;
} = {}): Promise<number> {
    const whereConditions = [eq(payments.status, 'succeeded')];

    if (options.startDate) {
        whereConditions.push(gte(payments.createdAt, options.startDate));
    }
    if (options.endDate) {
        whereConditions.push(lte(payments.createdAt, options.endDate));
    }

    const [result] = await db()
        .select({
            total: sql<number>`SUM(CASE WHEN ${payments.status} = 'succeeded' THEN CAST(${payments.amount} AS NUMERIC) ELSE 0 END)`
        })
        .from(payments)
        .where(and(...whereConditions));

    return Number(result?.total) || 0;
}

/**
 * Get total revenue by currency
 */
export async function getTotalRevenueByCurrency(options: {
    startDate?: Date;
    endDate?: Date;
} = {}): Promise<{ currencies: { [currency: string]: number } }> {
    const whereConditions = [eq(payments.status, 'succeeded')];

    if (options.startDate) {
        whereConditions.push(gte(payments.createdAt, options.startDate));
    }
    if (options.endDate) {
        whereConditions.push(lte(payments.createdAt, options.endDate));
    }

    const results = await db()
        .select({
            currency: payments.currency,
            total: sql<number>`SUM(CASE WHEN ${payments.status} = 'succeeded' THEN CAST(${payments.amount} AS NUMERIC) ELSE 0 END)`
        })
        .from(payments)
        .where(and(...whereConditions))
        .groupBy(payments.currency)
        .orderBy(desc(payments.currency));

    const currencies: { [currency: string]: number } = {};
    for (const result of results) {
        currencies[result.currency || 'USD'] = Number(result.total) || 0;
    }

    return { currencies };
}

/**
 * Get monthly revenue for current month
 */
export async function getMonthlyRevenue(options: {
    currency?: string;
} = {}): Promise<number> {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const whereConditions = [
        eq(payments.status, 'succeeded'),
        gte(payments.createdAt, firstDayOfMonth),
        lte(payments.createdAt, lastDayOfMonth)
    ];

    if (options.currency) {
        whereConditions.push(eq(payments.currency, options.currency));
    }

    const [result] = await db()
        .select({
            total: sql<number>`SUM(CASE WHEN ${payments.status} = 'succeeded' THEN CAST(${payments.amount} AS NUMERIC) ELSE 0 END)`
        })
        .from(payments)
        .where(and(...whereConditions));

    return Number(result?.total) || 0;
}

/**
 * Get monthly revenue by currency
 */
export async function getMonthlyRevenueByCurrency(): Promise<{
    total: number;
    currencies: { [currency: string]: number };
}> {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const results = await db()
        .select({
            currency: payments.currency,
            total: sql<number>`SUM(CASE WHEN ${payments.status} = 'succeeded' THEN CAST(${payments.amount} AS NUMERIC) ELSE 0 END)`
        })
        .from(payments)
        .where(
            and(
                eq(payments.status, 'succeeded'),
                gte(payments.createdAt, firstDayOfMonth),
                lte(payments.createdAt, lastDayOfMonth)
            )
        )
        .groupBy(payments.currency)
        .orderBy(desc(payments.currency));

    let total = 0;
    const currencies: { [currency: string]: number } = {};

    for (const result of results) {
        const amount = Number(result.total) || 0;
        total += amount;
        currencies[result.currency || 'USD'] = amount;
    }

    return { total, currencies };
}