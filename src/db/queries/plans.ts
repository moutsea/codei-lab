import { db } from "../index";
import { plans } from "../schema";
import { eq, and, desc, ilike, sql, isNull, or } from "drizzle-orm";
import type { PlanInsert, PlanSelect } from "@/types";

// ========== Create Operations ==========

/**
 * Create a new plan
 */
export async function createPlan(data: PlanInsert) {
  const [plan] = await db().insert(plans).values({
    ...data,
    createdAt: new Date(),
  }).returning();
  return plan;
}

/**
 * Create multiple plans
 */
export async function createPlans(data: PlanInsert[]) {
  const createdPlans = await db().insert(plans).values(
    data.map(plan => ({
      ...plan,
      createdAt: new Date(),
    }))
  ).returning();
  return createdPlans;
}

// ========== Read Operations ==========

/**
 * Get plan by ID
 */
export async function getPlanById(id: string): Promise<PlanSelect | null> {
  const [plan] = await db().select().from(plans).where(eq(plans.id, id)).limit(1);
  return plan || null;
}

/**
 * Get plan by Stripe product ID
 */
export async function getPlanByStripeProductId(stripeProductId: string): Promise<PlanSelect | null> {
  const [plan] = await db().select().from(plans).where(eq(plans.stripeProductId, stripeProductId)).limit(1);
  return plan || null;
}

/**
 * Get all recurring plans
 */
export async function getActiveRecurringPlans(): Promise<PlanSelect[]> {
  return await db()
    .select()
    .from(plans)
    .where(eq(plans.isRecurring, true))
    .orderBy(plans.quota);
}

/**
 * Get all non-recurring plans
 */
export async function getActiveNonRecurringPlans(): Promise<PlanSelect[]> {
  return await db()
    .select()
    .from(plans)
    .where(eq(plans.isRecurring, false))
    .orderBy(plans.quota);
}

/**
 * Get all plans
 */
export async function getAllActivePlans(): Promise<PlanSelect[]> {
  return await db()
    .select()
    .from(plans)
    .orderBy(plans.quota);
}

/**
 * Get all plans (including inactive)
 */
export async function getAllRecurringPlans(): Promise<PlanSelect[]> {
  return await db()
    .select()
    .from(plans)
    .where(eq(plans.isRecurring, true))
    .orderBy(desc(plans.quota));
}


/**
 * Search plans by name or description
 */
export async function searchPlans(query: string, limit: number = 10): Promise<PlanSelect[]> {
  return await db()
    .select()
    .from(plans)
    .where(
      or(
        ilike(plans.name, `%${query}%`),
        ilike(plans.description, `%${query}%`)
      )
    )
    .limit(limit);
}

/**
 * Get plans by type
 */
export async function getPlansByType(type: string): Promise<PlanSelect[]> {
  return await db()
    .select()
    .from(plans)
    .where(eq(plans.type, type))
    .orderBy(plans.quota);
}

/**
 * Get frontpage plans (type = 'pay' or type = 'sub')
 */
export async function getFrontpagePlans(): Promise<PlanSelect[]> {
  return await db()
    .select()
    .from(plans)
    .where(
      or(
        eq(plans.type, 'pay'),
        eq(plans.type, 'sub')
      )
    )
    .orderBy(plans.quota);
}

/**
 * Get plan by Stripe price ID
 */
export async function getPlanByStripePriceId(stripePriceId: string): Promise<PlanSelect | null> {
  const [plan] = await db()
    .select()
    .from(plans)
    .where(eq(plans.stripePriceId, stripePriceId))
    .limit(1);
  return plan || null;
}

// ========== Update Operations ==========

/**
 * Update plan by ID
 */
export async function updatePlanById(
  id: string,
  data: Partial<Omit<PlanInsert, 'id' | 'createdAt'>>
): Promise<PlanSelect | null> {
  const [plan] = await db()
    .update(plans)
    .set(data)
    .where(eq(plans.id, id))
    .returning();
  return plan || null;
}

/**
 * Update plan by Stripe product ID
 */
export async function updatePlanByStripeProductId(
  stripeProductId: string,
  data: Partial<Omit<PlanInsert, 'id' | 'createdAt'>>
): Promise<PlanSelect | null> {
  const [plan] = await db()
    .update(plans)
    .set(data)
    .where(eq(plans.stripeProductId, stripeProductId))
    .returning();
  return plan || null;
}

/**
 * Update plan pricing
 */
export async function updatePlanPricing(
  id: string,
  data: {
    stripePriceId?: string;
    quota?: string;
  }
): Promise<PlanSelect | null> {
  return await updatePlanById(id, data);
}

// Note: modelAccess functionality removed as it's not in the current schema

// Note: isActive functionality removed as it's not in the current schema

// ========== Delete Operations ==========

/**
 * Delete plan by ID
 */
export async function deletePlanById(id: string): Promise<PlanSelect | null> {
  const [plan] = await db()
    .delete(plans)
    .where(eq(plans.id, id))
    .returning();
  return plan || null;
}

/**
 * Delete plan by Stripe product ID
 */
export async function deletePlanByStripeProductId(stripeProductId: string): Promise<PlanSelect | null> {
  const [plan] = await db()
    .delete(plans)
    .where(eq(plans.stripeProductId, stripeProductId))
    .returning();
  return plan || null;
}

