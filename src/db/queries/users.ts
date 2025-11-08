import { db } from "../index";
import { users, subscriptions, plans, monthlyUserUsage, dailyUserUsage } from "../schema";
import { eq, and, desc, sql, gt, gte } from "drizzle-orm";
import type { UserInsert, UserSelect } from "@/types";
import type { UserDetail } from "@/types/db";

// ========== Create Operations ==========

/**
 * Create a new user
 */
export async function createUser(data: UserInsert) {
  const [user] = await db().insert(users).values({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return user;
}

/**
 * Create user with email ID (helper function)
 */
export async function createUserFromEmail(emailData: {
  id: string;
  email: string;
  nickname?: string;
  avatarUrl?: string;
}) {
  const [user] = await db().insert(users).values({
    ...emailData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return user;
}

// ========== Read Operations ==========

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<UserSelect | null> {
  const [user] = await db().select().from(users).where(eq(users.id, id)).limit(1);
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
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const offset = (page - 1) * limit;

  // Add sorting
  const sortColumn = sortBy === 'createdAt' ? users.createdAt :
    sortBy === 'updatedAt' ? users.updatedAt : users.id;
  const sortDirection = sortOrder === 'asc' ? sql`${sortColumn} ASC` : sql`${sortColumn} DESC`;

  // Add pagination and execute
  return await db()
    .select()
    .from(users)
    .orderBy(sortDirection)
    .limit(limit)
    .offset(offset);
}

/**
 * Get users count
 */
export async function getUsersCount(): Promise<number> {
  const [result] = await db()
    .select({ count: sql<number>`count(*)` })
    .from(users);
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
  id: string,
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
 * Update user's Stripe customer ID
 */
export async function updateUserStripeCustomerId(
  id: string,
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
export async function deleteUserById(id: string): Promise<UserSelect | null> {
  const [user] = await db()
    .delete(users)
    .where(eq(users.id, id))
    .returning();
  return user || null;
}



// ========== User Cache Data Functions ==========

/**
 * Get user cache data by userId - joins user, subscription, plan, and monthly usage tables
 */
export async function getUserDetailById(userId: string): Promise<UserDetail | null> {

  const userLastSubscription = db()
    .select({
      userId: monthlyUserUsage.userId,
      month: monthlyUserUsage.month,
      inputTokens: monthlyUserUsage.inputTokens,
      cachedTokens: monthlyUserUsage.cachedTokens,
      outputTokens: monthlyUserUsage.outputTokens,
      quotaUsed: monthlyUserUsage.quotaUsed,
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
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      stripeCustomerId: users.stripeCustomerId,
      startDate: subscriptions.startDate,
      planId: subscriptions.planId,
      membershipLevel: plans.membershipLevel,
      active: sql<boolean>`(${subscriptions.status} = 'active' AND ${subscriptions.currentPeriodEnd} > NOW())`, //sql<boolean>`CASE WHEN ${subscriptions.status} = 'active' THEN true ELSE false END`,
      currendEndAt: subscriptions.currentPeriodEnd,
      quota: plans.quota,
      quotaMonthlyUsed: sql<string>`COALESCE(${userLastSubscription.quotaUsed}, '0')`,
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
    stripeCustomerId: row.stripeCustomerId!,
    startDate: row.startDate,
    stripeSubscriptionId: row.stripeSubscriptionId || undefined,
    planId: row.planId || undefined,
    membershipLevel: row.membershipLevel || undefined,
    active: row.active,
    currentEndAt: row.currendEndAt,
    quota: row.quota || "0",
    quotaMonthlyUsed: row.quotaMonthlyUsed || "0",
  };
}


