import { db } from "../index";
import { users, subscriptions, plans, monthlyUserUsage, dailyUserUsage } from "../schema";
import { eq, and, desc, ilike, sql, or, gt, gte, lte } from "drizzle-orm";
import type { UserInsert, UserSelect } from "../schema";
import { cache, cacheKeys } from "@/lib/cache";

export interface UserDetail {
  userId: number;
  name?: string | null;
  email?: string | null;
  auth0UserId: string;
  stripeSubscriptionId?: string; // from subscription
  stripeCustomerId: string;
  startDate?: Date | null;
  planId?: string; // from plan
  membershipLevel?: string; // from plan
  active?: boolean; // from subscription
  currentEndAt?: Date | null; // from subscription
  requestLimit: number; // from plan
  tokenMonthlyUsed?: number; // from monthly-user-usage table
}

// ========== Create Operations ==========

/**
 * Create a new user
 */
export async function createUser(data: Omit<UserInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const [user] = await db().insert(users).values({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return user;
}

/**
 * Create user with Auth0 ID (helper function)
 */
export async function createUserFromAuth0(auth0Data: {
  auth0UserId: string;
  email: string;
  nickname?: string;
  avatarUrl?: string;
}) {
  const [user] = await db().insert(users).values({
    ...auth0Data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return user;
}

// ========== Read Operations ==========

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<UserSelect | null> {
  const [user] = await db().select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

/**
 * Get user by Auth0 user ID
 */
export async function getUserByAuth0Id(auth0UserId: string): Promise<UserSelect | null> {
  const [user] = await db().select().from(users).where(eq(users.auth0UserId, auth0UserId)).limit(1);
  return user || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserSelect | null> {
  const [user] = await db().select().from(users).where(eq(users.email, email)).limit(1);
  return user || null;
}

/**
 * Get user by Stripe customer ID
 */
export async function getUserByStripeCustomerId(stripeCustomerId: string): Promise<UserSelect | null> {
  const [user] = await db().select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId)).limit(1);
  return user || null;
}

/**
 * Get all users with pagination
 */
export async function getAllUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'email';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const offset = (page - 1) * limit;

  // Build query with conditional filters
  const baseQuery = db().select().from(users);

  // Add search filter
  const withSearch = search
    ? baseQuery.where(
      or(
        ilike(users.email, `%${search}%`),
        ilike(users.nickname, `%${search}%`)
      )
    )
    : baseQuery;

  // Add sorting
  const sortColumn = sortBy === 'createdAt' ? users.createdAt :
    sortBy === 'updatedAt' ? users.updatedAt : users.email;
  const sortDirection = sortOrder === 'asc' ? sql`${sortColumn} ASC` : sql`${sortColumn} DESC`;

  // Add pagination and execute
  return await withSearch
    .orderBy(sortDirection)
    .limit(limit)
    .offset(offset);
}

/**
 * Get users count
 */
export async function getUsersCount(search?: string): Promise<number> {
  const baseQuery = db().select({ count: sql<number>`count(*)` }).from(users);

  const finalQuery = search
    ? baseQuery.where(
      or(
        ilike(users.email, `%${search}%`),
        ilike(users.nickname, `%${search}%`)
      )
    )
    : baseQuery;

  const [result] = await finalQuery;
  return result.count;
}

/**
 * Get new users count created in current month
 */
export async function getNewUsersThisMonth(): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [result] = await db()
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(gte(users.createdAt, startOfMonth));

  return result.count || 0;
}

// ========== Update Operations ==========

/**
 * Update user by ID
 */
export async function updateUserById(
  id: number,
  data: Partial<Omit<UserInsert, 'id' | 'createdAt'>>
): Promise<UserSelect | null> {
  const [user] = await db()
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user || null;
}

/**
 * Update user by Auth0 ID
 */
export async function updateUserByAuth0Id(
  auth0UserId: string,
  data: Partial<Omit<UserInsert, 'id' | 'createdAt'>>
): Promise<UserSelect | null> {
  const [user] = await db()
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.auth0UserId, auth0UserId))
    .returning();

  // 清除用户缓存，因为用户数据已更新
  if (user) {
    try {
      const cacheKey = cacheKeys.userData(auth0UserId);
      await cache.delete(cacheKey);

      // 如果更新了 stripeCustomerId，也清除对应的缓存
      if (data.stripeCustomerId) {
        await cache.delete(cacheKeys.customerId(auth0UserId));
      }
    } catch (error) {
      console.error('Failed to clear user cache after update:', error);
    }
  }

  return user || null;
}

/**
 * Update user's Stripe customer ID
 */
export async function updateUserStripeCustomerId(
  id: number,
  stripeCustomerId: string
): Promise<UserSelect | null> {
  const [user] = await db()
    .update(users)
    .set({
      stripeCustomerId,
      updatedAt: new Date()
    })
    .where(eq(users.id, id))
    .returning();
  return user || null;
}

// ========== Delete Operations ==========

/**
 * Delete user by ID
 */
export async function deleteUserById(id: number): Promise<UserSelect | null> {
  const [user] = await db()
    .delete(users)
    .where(eq(users.id, id))
    .returning();
  return user || null;
}

/**
 * Delete user by Auth0 ID
 */
export async function deleteUserByAuth0Id(auth0UserId: string): Promise<UserSelect | null> {
  const [user] = await db()
    .delete(users)
    .where(eq(users.auth0UserId, auth0UserId))
    .returning();
  return user || null;
}


// ========== User Cache Data Functions ==========

/**
 * Get user cache data by userId - joins user, subscription, plan, and monthly usage tables
 */
export async function getUserDetailById(userId: number): Promise<UserDetail | null> {

  const userLastSubscription = db()
    .select({
      userId: monthlyUserUsage.userId,
      month: monthlyUserUsage.month,
      totalTokens: monthlyUserUsage.totalTokens,
    })
    .from(monthlyUserUsage)
    .where(eq(monthlyUserUsage.userId, userId))
    .orderBy(desc(monthlyUserUsage.month))
    .limit(1)
    .as("userLastSubscription");

  const result = await db()
    .select({
      userId: users.id,
      name: users.nickname,
      email: users.email,
      auth0UserId: users.auth0UserId,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      stripeCustomerId: users.stripeCustomerId,
      startDate: subscriptions.startDate,
      planId: subscriptions.planId,
      membershipLevel: plans.membershipLevel,
      active: sql<boolean>`(${subscriptions.status} = 'active' AND ${subscriptions.currentPeriodEnd} > NOW())`, //sql<boolean>`CASE WHEN ${subscriptions.status} = 'active' THEN true ELSE false END`,
      currendEndAt: subscriptions.currentPeriodEnd,
      requestLimit: plans.requestLimit,
      tokenMonthlyUsed: userLastSubscription.totalTokens,
    })
    .from(users)
    .leftJoin(subscriptions, and(
      eq(users.id, subscriptions.userId),
      eq(subscriptions.status, 'active'),
      gt(subscriptions.currentPeriodEnd, sql`NOW()`),
    ))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .leftJoin(userLastSubscription, eq(users.id, userLastSubscription.userId))
    .where(eq(users.id, userId))
    .orderBy(desc(subscriptions.currentPeriodEnd))
    .limit(1);

  const row = result[0];

  // console.log("=====row=====\n", row);
  if (!row) return null;

  return {
    userId: row.userId,
    name: row.name,
    email: row.email,
    auth0UserId: row.auth0UserId,
    stripeCustomerId: row.stripeCustomerId!,
    startDate: row.startDate,
    stripeSubscriptionId: row.stripeSubscriptionId || undefined,
    planId: row.planId || undefined,
    membershipLevel: row.membershipLevel || undefined,
    active: row.active,
    currentEndAt: row.currendEndAt,
    requestLimit: row.requestLimit!,
    tokenMonthlyUsed: row.tokenMonthlyUsed || 0,
  };
}


