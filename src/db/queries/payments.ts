import { db } from "../index";
import { payments, users, subscriptions } from "../schema";
import { eq, and, desc, asc, ilike, sql, or, gte, lte } from "drizzle-orm";
import type { PaymentInsert, PaymentSelect } from "../schema";

// ========== Create Operations ==========

/**
 * Create a new payment record
 */
export async function createPayment(data: Omit<PaymentInsert, 'id' | 'createdAt'>): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .insert(payments)
        .values({
            ...data,
            createdAt: new Date(),
        })
        .returning();
    return payment;
}

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
 * Get payment by ID
 */
export async function getPaymentById(id: number): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .select()
        .from(payments)
        .where(eq(payments.id, id))
        .limit(1);
    return payment || null;
}

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
 * Get payments by user ID
 */
export async function getPaymentsByUserId(userId: string): Promise<PaymentSelect[]> {
    return await db()
        .select()
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt));
}

/**
 * Get payments by subscription ID
 */
export async function getPaymentsBySubscriptionId(subscriptionId: string): Promise<PaymentSelect[]> {
    return await db()
        .select()
        .from(payments)
        .where(eq(payments.subscriptionId, subscriptionId))
        .orderBy(desc(payments.createdAt));
}

/**
 * Get payments by status
 */
export async function getPaymentsByStatus(status: string): Promise<PaymentSelect[]> {
    return await db()
        .select()
        .from(payments)
        .where(eq(payments.status, status))
        .orderBy(desc(payments.createdAt));
}

/**
 * Get payments with pagination
 */
export async function getPayments(options: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: string;
    sortBy?: 'createdAt' | 'amount' | 'status';
    sortOrder?: 'asc' | 'desc';
} = {}) {
    const {
        page = 1,
        limit = 20,
        userId,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    const whereConditions = [];

    // Add user filter
    if (userId !== undefined) {
        whereConditions.push(eq(payments.userId, userId));
    }

    // Add status filter
    if (status) {
        whereConditions.push(eq(payments.status, status));
    }

    // Add sorting
    const sortColumn = sortBy === 'amount' ? payments.amount :
        sortBy === 'status' ? payments.status : payments.createdAt;
    const sortDirection = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    let query = db().select().from(payments);

    if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions)) as typeof query;
    }

    return await query
        .orderBy(sortDirection)
        .limit(limit)
        .offset(offset);
}

/**
 * Get successful payments for a user
 */
export async function getSuccessfulPaymentsByUserId(userId: string): Promise<PaymentSelect[]> {
    return await db()
        .select()
        .from(payments)
        .where(
            and(
                eq(payments.userId, userId),
                eq(payments.status, 'succeeded')
            )
        )
        .orderBy(desc(payments.createdAt));
}

/**
 * Get failed payments for a user
 */
export async function getFailedPaymentsByUserId(userId: string): Promise<PaymentSelect[]> {
    return await db()
        .select()
        .from(payments)
        .where(
            and(
                eq(payments.userId, userId),
                eq(payments.status, 'failed')
            )
        )
        .orderBy(desc(payments.createdAt));
}

/**
 * Get payments within date range
 */
export async function getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<PaymentSelect[]> {
    return await db()
        .select()
        .from(payments)
        .where(
            and(
                sql`${payments.createdAt} >= ${startDate}`,
                sql`${payments.createdAt} <= ${endDate}`
            )
        )
        .orderBy(desc(payments.createdAt));
}

/**
 * Get payments with user and subscription details
 */
export async function getPaymentsWithDetails(options: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: string;
} = {}) {
    const {
        page = 1,
        limit = 20,
        userId,
        status
    } = options;

    const offset = (page - 1) * limit;
    const whereConditions = [];

    // Add user filter
    if (userId !== undefined) {
        whereConditions.push(eq(payments.userId, userId));
    }

    // Add status filter
    if (status) {
        whereConditions.push(eq(payments.status, status));
    }

    let query = db()
        .select({
            id: payments.id,
            userId: payments.userId,
            userEmail: users.email,
            userName: users.nickname,
            subscriptionId: payments.subscriptionId,
            stripePaymentIntentId: payments.stripePaymentIntentId,
            amount: payments.amount,
            currency: payments.currency,
            status: payments.status,
            createdAt: payments.createdAt,
        })
        .from(payments)
        .leftJoin(users, eq(payments.userId, users.id))
        .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.stripeSubscriptionId));

    if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions)) as typeof query;
    }

    return await query
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset);
}

/**
 * Get payments count
 */
export async function getPaymentsCount(status?: string): Promise<number> {
    const whereConditions = [];

    if (status) {
        whereConditions.push(eq(payments.status, status));
    }

    if (whereConditions.length > 0) {
        const [result] = await db()
            .select({ count: sql<number>`count(*)` })
            .from(payments)
            .where(and(...whereConditions));
        return result.count;
    } else {
        const [result] = await db()
            .select({ count: sql<number>`count(*)` })
            .from(payments);
        return result.count;
    }
}

/**
 * Get total revenue (sum of successful payments) by currency
 */
export async function getTotalRevenue(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    currency?: string; // If specified, returns total for specific currency
} = {}): Promise<number> {
    const { startDate, endDate, userId, currency } = options;
    const whereConditions = [eq(payments.status, 'paid')];

    if (userId !== undefined) {
        whereConditions.push(eq(payments.userId, userId));
    }

    if (currency) {
        whereConditions.push(eq(payments.currency, currency.toUpperCase()));
    }

    if (startDate) {
        whereConditions.push(sql`${payments.createdAt} >= ${startDate}`);
    }

    if (endDate) {
        whereConditions.push(sql`${payments.createdAt} <= ${endDate}`);
    }

    const [result] = await db()
        .select({ total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)` })
        .from(payments)
        .where(and(...whereConditions));

    return Number(result.total) || 0;
}

/**
 * Get total revenue breakdown by currency
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

    if (userId !== undefined) {
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
// ========== Update Operations ==========

/**
 * Update payment by ID
 */
export async function updatePaymentById(
    id: number,
    data: Partial<Omit<PaymentInsert, 'id' | 'createdAt'>>
): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .update(payments)
        .set(data)
        .where(eq(payments.id, id))
        .returning();
    return payment || null;
}

/**
 * Update payment by Stripe payment intent ID
 */
export async function updatePaymentByStripePaymentIntentId(
    stripePaymentIntentId: string,
    data: Partial<Omit<PaymentInsert, 'id' | 'createdAt'>>
): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .update(payments)
        .set(data)
        .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
        .returning();
    return payment || null;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(id: number, status: string): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .update(payments)
        .set({ status })
        .where(eq(payments.id, id))
        .returning();
    return payment || null;
}

/**
 * Mark payment as successful
 */
export async function markPaymentAsSuccessful(id: number): Promise<PaymentSelect | null> {
    return await updatePaymentStatus(id, 'succeeded');
}

/**
 * Mark payment as failed
 */
export async function markPaymentAsFailed(id: number): Promise<PaymentSelect | null> {
    return await updatePaymentStatus(id, 'failed');
}

/**
 * Refund payment
 */
export async function refundPayment(id: number, amount?: string): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .update(payments)
        .set({
            status: 'refunded',
            ...(amount && { amount })
        })
        .where(eq(payments.id, id))
        .returning();
    return payment || null;
}

// ========== Delete Operations ==========

/**
 * Delete payment by ID
 */
export async function deletePaymentById(id: number): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .delete(payments)
        .where(eq(payments.id, id))
        .returning();
    return payment || null;
}

/**
 * Delete payment by Stripe payment intent ID
 */
export async function deletePaymentByStripePaymentIntentId(stripePaymentIntentId: string): Promise<PaymentSelect | null> {
    const [payment] = await db()
        .delete(payments)
        .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
        .returning();
    return payment || null;
}

/**
 * Delete payments by user ID (bulk delete)
 */
export async function deletePaymentsByUserId(userId: string): Promise<PaymentSelect[]> {
    return await db()
        .delete(payments)
        .where(eq(payments.userId, userId))
        .returning();
}

// ========== Utility Functions ==========

/**
 * Check if payment exists by Stripe payment intent ID
 */
export async function paymentExistsByStripePaymentIntentId(stripePaymentIntentId: string): Promise<boolean> {
    const [result] = await db()
        .select({ exists: sql<boolean>`true` })
        .from(payments)
        .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
        .limit(1);

    return !!result;
}

/**
 * Get payment statistics for a user
 */
export async function getUserPaymentStats(userId: string): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    totalAmount: number;
    successfulAmount: number;
}> {
    const [totalResult] = await db()
        .select({
            count: sql<number>`COUNT(*)`,
            amount: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`
        })
        .from(payments)
        .where(eq(payments.userId, userId));

    const [successResult] = await db()
        .select({
            count: sql<number>`COUNT(*)`,
            amount: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`
        })
        .from(payments)
        .where(
            and(
                eq(payments.userId, userId),
                eq(payments.status, 'succeeded')
            )
        );

    const [failedResult] = await db()
        .select({ count: sql<number>`COUNT(*)` })
        .from(payments)
        .where(
            and(
                eq(payments.userId, userId),
                eq(payments.status, 'failed')
            )
        );

    return {
        totalPayments: totalResult.count || 0,
        successfulPayments: successResult.count || 0,
        failedPayments: failedResult.count || 0,
        totalAmount: Number(totalResult.amount) || 0,
        successfulAmount: Number(successResult.amount) || 0,
    };
}

/**
 * Get recent payments for a user
 */
export async function getRecentPaymentsByUserId(userId: string, limit: number = 10): Promise<PaymentSelect[]> {
    return await db()
        .select()
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt))
        .limit(limit);
}

/**
 * Get payments with search functionality
 */
export async function searchPayments(query: string, limit: number = 20): Promise<PaymentSelect[]> {
    return await db()
        .select({
            id: payments.id,
            userId: payments.userId,
            subscriptionId: payments.subscriptionId,
            stripePaymentIntentId: payments.stripePaymentIntentId,
            amount: payments.amount,
            currency: payments.currency,
            status: payments.status,
            createdAt: payments.createdAt,
        })
        .from(payments)
        .leftJoin(users, eq(payments.userId, users.id))
        .where(
            or(
                ilike(payments.stripePaymentIntentId, `%${query}%`),
                ilike(payments.status, `%${query}%`),
                ilike(users.email, `%${query}%`)
            )
        )
        .orderBy(desc(payments.createdAt))
        .limit(limit);
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

/**
 * Get monthly revenue for specific month and year
 */
export async function getMonthlyRevenueForMonth(month: number, year: number, options: {
    currency?: string;
} = {}): Promise<number> {
    const { currency } = options;
    const startOfMonth = new Date(year, month - 1, 1); // JavaScript months are 0-indexed
    const endOfMonth = new Date(year, month, 0); // Last day of the month

    const whereConditions = [
        eq(payments.status, 'paid'),
        gte(payments.createdAt, startOfMonth),
        lte(payments.createdAt, endOfMonth)
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
 * Get monthly revenue breakdown by currency for specific month and year
 */
export async function getMonthlyRevenueByCurrencyForMonth(month: number, year: number): Promise<{
    total: number;
    currencies: {
        [currency: string]: {
            amount: number;
            currency: string;
            count: number;
        };
    };
}> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

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
                gte(payments.createdAt, startOfMonth),
                lte(payments.createdAt, endOfMonth)
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