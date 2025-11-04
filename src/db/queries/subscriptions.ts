import { db } from "../index";
import { subscriptions, users } from "../schema";
import { eq, and, desc, asc, sql, isNull, gt, or, gte } from "drizzle-orm";
import type { SubscriptionInsert, SubscriptionSelect } from "../schema";

// ========== Create Operations ==========

/**
 * Create a new subscription
 */
export async function createSubscription(data: Omit<SubscriptionInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const [subscription] = await db().insert(subscriptions).values({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return subscription;
}

// ========== Read Operations ==========

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(id: number): Promise<SubscriptionSelect | null> {
  const [subscription] = await db().select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  return subscription || null;
}

/**
 * Get subscription by user ID
 */
export async function getSubscriptionByUserId(userId: number): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return subscription || null;
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeSubscriptionId(stripeSubscriptionId: string): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return subscription || null;
}

/**
 * Get active subscriptions for a user
 */
export async function getActiveSubscriptionsByUserId(userId: number): Promise<SubscriptionSelect[]> {
  return await db()
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        or(
          isNull(subscriptions.cancelAt),
          gt(subscriptions.cancelAt, new Date())
        )
      )
    )
    .orderBy(desc(subscriptions.createdAt));
}

/**
 * Get all subscriptions for a user
 */
export async function getAllSubscriptionsByUserId(userId: number): Promise<SubscriptionSelect[]> {
  return await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));
}

/**
 * Get subscriptions by status
 */
export async function getSubscriptionsByStatus(status: string): Promise<SubscriptionSelect[]> {
  return await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, status))
    .orderBy(desc(subscriptions.createdAt));
}

/**
 * Get subscriptions with pagination
 */
export async function getSubscriptions(options: {
  page?: number;
  limit?: number;
  userId?: number;
  status?: string;
  sortBy?: 'createdAt' | 'startDate' | 'currentPeriodEnd';
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
    whereConditions.push(eq(subscriptions.userId, userId));
  }

  // Add status filter
  if (status) {
    whereConditions.push(eq(subscriptions.status, status));
  }

  // Add sorting
  const sortColumn = sortBy === 'startDate' ? subscriptions.startDate :
    sortBy === 'currentPeriodEnd' ? subscriptions.currentPeriodEnd : subscriptions.createdAt;
  const sortDirection = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  let query = db().select().from(subscriptions);

  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions)) as typeof query;
  }

  return await query
    .orderBy(sortDirection)
    .limit(limit)
    .offset(offset);
}

/**
 * Get expiring subscriptions (within N days)
 */
export async function getExpiringSubscriptions(days: number = 7): Promise<SubscriptionSelect[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);

  return await db()
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'active'),
        eq(subscriptions.cancelAtPeriodEnd, true),
        sql`${subscriptions.currentPeriodEnd} <= ${cutoffDate}`,
        sql`${subscriptions.currentPeriodEnd} >= ${new Date()}`
      )
    )
    .orderBy(asc(subscriptions.currentPeriodEnd));
}

/**
 * Get cancelled subscriptions (not yet ended)
 */
export async function getCancelledActiveSubscriptions(): Promise<SubscriptionSelect[]> {
  return await db()
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'canceled'),
        eq(subscriptions.cancelAtPeriodEnd, true),
        sql`${subscriptions.currentPeriodEnd} >= ${new Date()}`
      )
    )
    .orderBy(desc(subscriptions.cancelAt));
}

/**
 * Get subscriptions count
 */
export async function getSubscriptionsCount(status?: string): Promise<number> {
  const whereConditions = [];

  if (status) {
    whereConditions.push(eq(subscriptions.status, status));
  }

  if (whereConditions.length > 0) {
    const [result] = await db()
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(and(...whereConditions));
    return result.count;
  } else {
    const [result] = await db()
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions);
    return result.count;
  }
}

// ========== Update Operations ==========

/**
 * Update subscription by ID
 */
export async function updateSubscriptionById(
  id: number,
  data: Partial<Omit<SubscriptionInsert, 'id' | 'createdAt'>>
): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .update(subscriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptions.id, id))
    .returning();
  return subscription || null;
}

/**
 * Update subscription by Stripe subscription ID
 */
export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  data: Partial<Omit<SubscriptionInsert, 'id' | 'createdAt'>>
): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .update(subscriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .returning();
  return subscription || null;
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(id: number, status: string): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .update(subscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(subscriptions.id, id))
    .returning();
  return subscription || null;
}

/**
 * Cancel subscription (set cancel date)
 */
export async function cancelSubscription(id: number, cancelAt: Date): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .update(subscriptions)
    .set({
      status: 'canceled',
      cancelAt,
      cancelAtPeriodEnd: true,
      updatedAt: new Date()
    })
    .where(eq(subscriptions.id, id))
    .returning();
  return subscription || null;
}

/**
 * Cancel subscription at period end (Stripe style cancellation)
 */
export async function cancelSubscriptionAtPeriodEnd(id: number): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .update(subscriptions)
    .set({
      status: 'active', // Still active until period ends
      cancelAtPeriodEnd: true,
      updatedAt: new Date()
    })
    .where(eq(subscriptions.id, id))
    .returning();
  return subscription || null;
}

/**
 * Process subscription that ended due to cancellation
 */
export async function processEndedSubscription(stripeSubscriptionId: string): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .update(subscriptions)
    .set({
      status: 'canceled',
      updatedAt: new Date()
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .returning();
  return subscription || null;
}

/**
 * Renew subscription (update current period end and clear cancel date)
 */
export async function renewSubscription(
  id: number,
  currentPeriodEnd: Date
): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .update(subscriptions)
    .set({
      status: 'active',
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      cancelAt: null,
      updatedAt: new Date()
    })
    .where(eq(subscriptions.id, id))
    .returning();
  return subscription || null;
}

// ========== Delete Operations ==========

/**
 * Delete subscription by ID
 */
export async function deleteSubscriptionById(id: number): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .delete(subscriptions)
    .where(eq(subscriptions.id, id))
    .returning();
  return subscription || null;
}

/**
 * Delete subscription by Stripe subscription ID
 */
export async function deleteSubscriptionByStripeId(stripeSubscriptionId: string): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .delete(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .returning();
  return subscription || null;
}

// ========== Utility Functions ==========

/**
 * Check if subscription exists by Stripe subscription ID
 */
export async function subscriptionExistsByStripeId(stripeSubscriptionId: string): Promise<boolean> {
  const [result] = await db()
    .select({ exists: sql<boolean>`true` })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  return !!result;
}

/**
 * Check if user has active subscription
 */
export async function userHasActiveSubscription(userId: number): Promise<boolean> {
  const [result] = await db()
    .select({ exists: sql<boolean>`true` })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        sql`${subscriptions.currentPeriodEnd} >= ${new Date()}`,
        or(
          isNull(subscriptions.cancelAt),
          gt(subscriptions.cancelAt, new Date())
        )
      )
    )
    .limit(1);

  return !!result;
}

/**
 * Get user's current active subscription with details
 */
export async function getUserActiveSubscription(userId: number): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        sql`${subscriptions.currentPeriodEnd} >= ${new Date()}`,
        or(
          isNull(subscriptions.cancelAt),
          gt(subscriptions.cancelAt, new Date())
        )
      )
    )
    .orderBy(desc(subscriptions.currentPeriodEnd))
    .limit(1);
  return subscription || null;
}

/**
 * Get subscriptions that will expire soon (within N days)
 */
export async function getExpiringSoonSubscriptions(days: number = 3): Promise<SubscriptionSelect[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);

  return await db()
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'active'),
        eq(subscriptions.cancelAtPeriodEnd, true),
        sql`${subscriptions.currentPeriodEnd} <= ${cutoffDate}`,
        sql`${subscriptions.currentPeriodEnd} >= ${new Date()}`
      )
    )
    .orderBy(asc(subscriptions.currentPeriodEnd));
}

/**
 * Get latest subscription for user
 */
export async function getLatestSubscriptionForUser(userId: number): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return subscription || null;
}

/**
 * Get subscription by Auth0 user ID (joins with users table)
 */
export async function getSubscriptionByAuth0UserId(auth0UserId: string): Promise<SubscriptionSelect | null> {
  const [subscription] = await db()
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      startDate: subscriptions.startDate,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      cancelAt: subscriptions.cancelAt,
      renewsAt: subscriptions.renewsAt,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      stripeCustomerId: subscriptions.stripeCustomerId,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .where(eq(users.auth0UserId, auth0UserId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return subscription || null;
}

/**
 * Get subscription statistics (active and total counts)
 */
export async function getSubscriptionStats(): Promise<{
  active: number;
  total: number;
  conversionRate: string;
}> {
  try {
    const [activeCount] = await db()
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    const [totalCount] = await db()
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions);

    const active = Number(activeCount?.count || 0);
    const total = Number(totalCount?.count || 0);
    const conversionRate = total > 0 ? (active / total * 100).toFixed(1) : '0';

    return {
      active,
      total,
      conversionRate
    };
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return {
      active: 0,
      total: 0,
      conversionRate: '0'
    };
  }
}

/**
 * Get subscriptions created in current month
 */
export async function getSubscriptionsThisMonth(): Promise<number> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [result] = await db()
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(gte(subscriptions.createdAt, startOfMonth));

    return result.count || 0;
  } catch (error) {
    console.error('Error fetching subscriptions this month:', error);
    return 0;
  }
}