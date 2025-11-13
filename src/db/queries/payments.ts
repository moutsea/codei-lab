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
    orderBy: 'createdAt' | 'amount' | 'status' = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc'
): Promise<{
    payments: PaymentSelect[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
}> {
    const offset = (page - 1) * limit;

    // Determine sorting column and direction
    const sortColumn = orderBy === 'amount' ? payments.amount :
        orderBy === 'status' ? payments.status : payments.createdAt;
    const sortDirection = orderDirection === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get payments with pagination
    const paymentsResult = await db()
        .select()
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(sortDirection)
        .limit(limit)
        .offset(offset);

    // Get total count for pagination info
    const [countResult] = await db()
        .select({ count: sql<number>`count(*)` })
        .from(payments)
        .where(eq(payments.userId, userId));

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
        payments: paymentsResult,
        total,
        page,
        totalPages,
        limit
    };
}

/**
 * Get total payments count for a user
 */
export async function getPaymentsCountByUserId(userId: string): Promise<number> {
    const [result] = await db()
        .select({ count: sql<number>`count(*)` })
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
    userId?: string;
} = {}): Promise<{
    total: number;
    currencies: {
        [currency: string]: {
            amount: number;
            currency: string;
            count: number;
        };
    };
}> {
    const { startDate, endDate, userId } = options;
    const whereConditions = [eq(payments.status, 'paid')];

    if (userId) {
        whereConditions.push(eq(payments.userId, userId));
    }

    if (startDate) {
        whereConditions.push(sql`${payments.createdAt} >= ${startDate}`);
    }

    if (endDate) {
        whereConditions.push(sql`${payments.createdAt} <= ${endDate}`);
    }

    const results = await db()
        .select({
            currency: payments.currency,
            amount: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
            count: sql<number>`COUNT(${payments.id})`
        })
        .from(payments)
        .where(and(...whereConditions))
        .groupBy(payments.currency)
        .orderBy(sql`SUM(CAST(${payments.amount} AS NUMERIC)) DESC`);

    const currencies: { [currency: string]: { amount: number; currency: string; count: number } } = {};
    let total = 0;

    results.forEach(result => {
        const currency = result.currency?.toUpperCase() || 'USD';
        const amount = Number(result.amount) || 0;
        const count = Number(result.count) || 0;

        currencies[currency] = {
            currency,
            amount,
            count
        };

        total += amount;
    });

    return {
        total,
        currencies
    };
}

/**
 * Get revenue for current month (with optional currency filter)
 */
export async function getMonthlyRevenue(options: {
    currency?: string; // If specified, returns total for specific currency
} = {}): Promise<number> {
    const { currency } = options;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const whereConditions = [
        eq(payments.status, 'paid'),
        gte(payments.createdAt, startOfMonth)
    ];

    if (currency) {
        whereConditions.push(eq(payments.currency, currency.toUpperCase()));
    }

    const [result] = await db()
        .select({
            total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`
        })
        .from(payments)
        .where(and(...whereConditions));

    return Number(result?.total || 0);
}

/**
 * Get monthly revenue breakdown by currency
 */
export async function getMonthlyRevenueByCurrency(): Promise<{
    total: number;
    currencies: {
        [currency: string]: {
            amount: number;
            currency: string;
            count: number;
        };
    };
}> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const results = await db()
        .select({
            currency: payments.currency,
            amount: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
            count: sql<number>`COUNT(${payments.id})`
        })
        .from(payments)
        .where(
            and(
                eq(payments.status, 'paid'),
                gte(payments.createdAt, startOfMonth)
            )
        )
        .groupBy(payments.currency)
        .orderBy(sql`SUM(CAST(${payments.amount} AS NUMERIC)) DESC`);

    const currencies: { [currency: string]: { amount: number; currency: string; count: number } } = {};
    let total = 0;

    results.forEach(result => {
        const currency = result.currency?.toUpperCase() || 'USD';
        const amount = Number(result.amount) || 0;
        const count = Number(result.count) || 0;

        currencies[currency] = {
            currency,
            amount,
            count
        };

        total += amount;
    });

    return {
        total,
        currencies
    };
}