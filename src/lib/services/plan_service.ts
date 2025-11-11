import { getPlanById, getPlansByType, getFrontpagePlans } from '@/db/queries';
import type { PlanSelect } from '@/types/schema';
import { cache, cacheTTL } from '@/lib/cache';

export interface PlanWithPricing extends PlanSelect {
    monthlyPrice: number;
    quarterlyPrice: number;
    yearlyPrice: number;
    quarterlyDiscount: number;
    yearlyDiscount: number;
}

// Plan cache keys
export const planCacheKeys = {
    plansByType: (type: string) => `codei:plans:by_type:${type}`,
    frontpagePlans: () => 'codei:plans:frontpage',
};

export const getPlanFromDBById = async (planId: string): Promise<PlanSelect | null> => {
    try {
        const planFromDB = await getPlanById(planId);
        return planFromDB;
    } catch (error) {
        console.error('Database GET plan error:', error);
        return null;
    }
}

/**
 * Get plans by type from database with caching
 */
export const getPlansFromDBByType = async (type: string): Promise<PlanSelect[]> => {
    const cacheKey = planCacheKeys.plansByType(type);

    try {
        // Try to get from cache first
        const cachedPlans = await cache.get<PlanSelect[]>(cacheKey);
        if (cachedPlans) {
            console.log(`Cache HIT for plans by type: ${type}`);
            return cachedPlans;
        }

        // Cache miss - fetch from database
        console.log(`Cache MISS for plans by type: ${type}, fetching from database`);
        const plans = await getPlansByType(type);

        // Cache the result (24 hours TTL)
        await cache.set(cacheKey, plans, cacheTTL.PLAN);

        return plans;
    } catch (error) {
        console.error('Database GET plans by type error:', error);
        return [];
    }
}

/**
 * Get frontpage plans (pay or sub type) from database with caching
 */
export const getFrontpagePlansFromDB = async (): Promise<PlanSelect[]> => {
    const cacheKey = planCacheKeys.frontpagePlans();

    try {
        // Try to get from cache first
        const cachedPlans = await cache.get<PlanSelect[]>(cacheKey);
        if (cachedPlans) {
            console.log('Cache HIT for frontpage plans');
            return cachedPlans;
        }

        // Cache miss - fetch from database
        console.log('Cache MISS for frontpage plans, fetching from database');
        const plans = await getFrontpagePlans();

        // Cache the result (24 hours TTL)
        await cache.set(cacheKey, plans, cacheTTL.PLAN);

        return plans;
    } catch (error) {
        console.error('Database GET frontpage plans error:', error);
        return [];
    }
}

/**
 * Clear plan cache for specific type or all plans
 */
export const clearPlanCache = async (type?: string): Promise<void> => {
    try {
        if (type) {
            const cacheKey = planCacheKeys.plansByType(type);
            await cache.delete(cacheKey);
            console.log(`Cleared cache for plans by type: ${type}`);
        } else {
            // Clear all plan-related caches
            await cache.clearPattern('codei:plans:*');
            console.log('Cleared all plan caches');
        }
    } catch (error) {
        console.error('Error clearing plan cache:', error);
    }
}

