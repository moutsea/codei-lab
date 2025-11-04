import { cache, cacheKeys, cacheTTL } from '@/lib/cache';
import { getPlanById, getActiveRecurringPlans, getActiveNonRecurringPlans, getAllActivePlans } from '@/db/queries';
import type { PlanSelect } from '@/db/schema';

export interface PlanWithPricing extends PlanSelect {
    monthlyPrice: number;
    quarterlyPrice: number;
    yearlyPrice: number;
    quarterlyDiscount: number;
    yearlyDiscount: number;
}

export const getPlanFromDBById = async (planId: string): Promise<PlanSelect | null> => {
    const plan = await getPlanCache(planId);
    if (plan) return plan;

    // Fallback to database if cache miss
    try {
        const planFromDB = await getPlanById(planId);
        await setPlanCache(planId, planFromDB);
        return planFromDB;
    } catch (error) {
        console.error('Database GET plan error:', error);
        return null;
    }
}

// Plan 缓存查询方法
const getPlanCache = async (planId: string): Promise<any | null> => {
    // 首先检查缓存是否启用
    if (!cache.isCacheEnabled() || !planId) {
        return null;
    }

    try {
        const cacheKey = cacheKeys.plan(planId);
        const data = await cache.get(cacheKey);
        return data;
    } catch (error) {
        console.error('Cache GET plan error:', error);
        return null;
    }
}

export const setPlanCache = async (planId: string, data: any): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const cacheKey = cacheKeys.plan(planId);
        await cache.set(cacheKey, data, cacheTTL.PLAN);
    } catch (error) {
        console.error('Cache SET plan error:', error);
    }
}

export const deletePlanCache = async (planId: string): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const cacheKey = cacheKeys.plan(planId);
        await cache.delete(cacheKey);
        console.log(`✅ Deleted plan cache for planId: ${planId}`);
    } catch (error) {
        console.error('Cache DELETE plan error:', error);
    }
}

// 预加载所有 plans (包括订阅和非订阅) 到缓存中
export const preloadAllPlans = async (): Promise<void> => {
    if (!cache.isCacheEnabled()) {
        console.log('⚠️ Redis disabled, skipping plans preload');
        return;
    }

    try {
        const startTime = Date.now();
        console.log('🚀 Starting plans preload...');

        const allPlans = await getAllActivePlans();

        if (!allPlans || allPlans.length === 0) {
            console.log('ℹ️ No plans found to preload');
            return;
        }

        // 统计计划类型
        const recurringPlans = allPlans.filter(plan => plan.isRecurring);
        const nonRecurringPlans = allPlans.filter(plan => !plan.isRecurring);
        console.log(`📊 Found ${recurringPlans.length} recurring plans and ${nonRecurringPlans.length} non-recurring plans`);

        // 并行缓存所有 plans
        const cachePromises = allPlans.map(async (plan) => {
            try {
                await setPlanCache(plan.id, plan);
                return { planId: plan.id, success: true };
            } catch (error) {
                console.error(`❌ Failed to cache plan ${plan.id}:`, error);
                return { planId: plan.id, success: false, error };
            }
        });

        const results = await Promise.all(cachePromises);
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.length - successCount;

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`✅ Plans preload completed in ${duration}ms`);
        console.log(`📊 Stats: ${successCount}/${allPlans.length} plans cached successfully`);

        if (failedCount > 0) {
            console.log(`⚠️ ${failedCount} plans failed to cache`);
            const failedPlans = results.filter(r => !r.success);
            failedPlans.forEach(fp => {
                console.log(`  - Plan ${fp.planId}: ${fp.error instanceof Error ? fp.error.message : 'Unknown error'}`);
            });
        }
    } catch (error) {
        console.error('❌ Plans preload failed:', error);
    }
}

// Process plans data to calculate pricing and group by base plan name
function processPlansData(plansData: PlanSelect[]): PlanWithPricing[] {
    // 按产品分组（通过name或者stripeProductId）
    const planGroups: { [key: string]: PlanSelect[] } = {};

    plansData.forEach(plan => {
        const baseName = plan.name.replace(/\s*\([^)]*\)/g, '').trim(); // 移除周期标识
        if (!planGroups[baseName]) {
            planGroups[baseName] = [];
        }
        planGroups[baseName].push(plan);
    });

    // 处理每个产品组
    const result: PlanWithPricing[] = [];

    Object.entries(planGroups).forEach(([baseName, planVariants]) => {
        // 按金额排序，找到基础价格（通常是月付）
        planVariants.sort((a, b) => a.amount - b.amount);

        const monthlyPlan = planVariants.find(p => p.interval === 'month');
        const quarterlyPlan = planVariants.find(p => p.interval === 'quarter');
        const yearlyPlan = planVariants.find(p => p.interval === 'year');

        // 如果没有月付计划，使用最便宜的作为基准
        const basePlan = monthlyPlan || planVariants[0];

        // 计算不同周期的价格
        const monthlyPrice = monthlyPlan ? monthlyPlan.amount / 100 : basePlan.amount / 100;
        const quarterlyPrice = quarterlyPlan ? quarterlyPlan.amount / 100 : monthlyPrice * 3;
        const yearlyPrice = yearlyPlan ? yearlyPlan.amount / 100 : monthlyPrice * 12;

        // 计算折扣
        const quarterlyMonthlyPrice = quarterlyPrice / 3;
        const yearlyMonthlyPrice = yearlyPrice / 12;

        const quarterlyDiscount = Math.round((1 - quarterlyMonthlyPrice / monthlyPrice) * 100);
        const yearlyDiscount = Math.round((1 - yearlyMonthlyPrice / monthlyPrice) * 100);

        // 确定这个计划的特性（使用最完整的配置）
        const features = {
            requestLimit: Math.max(...planVariants.map(p => p.requestLimit)),
            modelAccess: planVariants.find(p => p.modelAccess && Array.isArray(p.modelAccess) && p.modelAccess.includes('all'))?.modelAccess || basePlan.modelAccess,
            stripeProductId: basePlan.stripeProductId,
            stripePriceId: monthlyPlan?.stripePriceId || basePlan.stripePriceId,
            membershipLevel: basePlan.membershipLevel
        };

        result.push({
            ...basePlan,
            name: baseName,
            ...features,
            monthlyPrice,
            quarterlyPrice,
            yearlyPrice,
            quarterlyDiscount,
            yearlyDiscount,
        });
    });

    // 按价格排序
    result.sort((a, b) => a.monthlyPrice - b.monthlyPrice);

    return result;
}

// Get processed plans with pricing calculations
export const getProcessedPlans = async (forceRefresh: boolean = false): Promise<PlanWithPricing[] | null> => {
    // First check cache if not forcing refresh
    if (!forceRefresh && cache.isCacheEnabled()) {
        try {
            const cacheKey = cacheKeys.processedPlans();
            const cachedPlans = await cache.get(cacheKey) as PlanWithPricing[] | null;
            if (cachedPlans) {
                console.log('✅ Cache HIT for processed plans');
                return cachedPlans;
            }
        } catch (error) {
            console.error('Cache GET processed plans error:', error);
        }
    } else if (forceRefresh && cache.isCacheEnabled()) {
        try {
            const cacheKey = cacheKeys.processedPlans();
            await cache.delete(cacheKey);
            console.log('🗑️ Cleared processed plans cache');
        } catch (error) {
            console.error('Cache DELETE processed plans error:', error);
        }
    }

    // Get plans from database
    try {
        const plans = await getActiveRecurringPlans();

        if (!plans || plans.length === 0) {
            console.warn('No active plans found');
            return null;
        }

        // Process the plans data
        const processedPlans = processPlansData(plans);

        // Cache the processed plans
        if (cache.isCacheEnabled()) {
            try {
                const cacheKey = cacheKeys.processedPlans();
                await cache.set(cacheKey, processedPlans, cacheTTL.API_RESPONSE);
                console.log('✅ Cached processed plans');
            } catch (error) {
                console.error('Cache SET processed plans error:', error);
            }
        }

        console.log(`✅ Processed ${processedPlans.length} plans`);
        return processedPlans;

    } catch (error) {
        console.error('Error getting processed plans:', error);
        return null;
    }
};

// Get processed plans cache only (for when you want to skip database entirely)
export const getProcessedPlansCache = async (): Promise<PlanWithPricing[] | null> => {
    if (!cache.isCacheEnabled()) {
        return null;
    }

    try {
        const cacheKey = cacheKeys.processedPlans();
        const cachedPlans = await cache.get(cacheKey) as PlanWithPricing[] | null;
        return cachedPlans || null;
    } catch (error) {
        console.error('Cache GET processed plans error:', error);
        return null;
    }
};

// Set processed plans cache (for manual caching)
export const setProcessedPlansCache = async (plans: PlanWithPricing[]): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const cacheKey = cacheKeys.processedPlans();
        await cache.set(cacheKey, plans, cacheTTL.API_RESPONSE);
        console.log(`✅ Cached ${plans.length} processed plans`);
    } catch (error) {
        console.error('Cache SET processed plans error:', error);
    }
};

// Delete processed plans cache
export const deleteProcessedPlansCache = async (): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const cacheKey = cacheKeys.processedPlans();
        await cache.delete(cacheKey);
        console.log('✅ Deleted processed plans cache');
    } catch (error) {
        console.error('Cache DELETE processed plans error:', error);
    }
};

// ============ NON-RECURRING PLANS METHODS ============

// Get active non-recurring plans with caching
export const getActiveNonRecurringPlansFromCache = async (forceRefresh: boolean = false): Promise<PlanSelect[] | null> => {
    // First check cache if not forcing refresh
    if (!forceRefresh && cache.isCacheEnabled()) {
        try {
            const cacheKey = cacheKeys.activeNonRecurringPlans();
            const cachedPlans = await cache.get(cacheKey) as PlanSelect[] | null;
            if (cachedPlans) {
                console.log('✅ Cache HIT for active non-recurring plans');
                return cachedPlans;
            }
        } catch (error) {
            console.error('Cache GET active non-recurring plans error:', error);
        }
    } else if (forceRefresh && cache.isCacheEnabled()) {
        try {
            const cacheKey = cacheKeys.activeNonRecurringPlans();
            await cache.delete(cacheKey);
            console.log('🗑️ Cleared active non-recurring plans cache');
        } catch (error) {
            console.error('Cache DELETE active non-recurring plans error:', error);
        }
    }

    // Get plans from database
    try {
        const plans = await getActiveNonRecurringPlans();

        if (!plans || plans.length === 0) {
            console.warn('No active non-recurring plans found');
            return null;
        }

        // Cache the plans
        if (cache.isCacheEnabled()) {
            try {
                const cacheKey = cacheKeys.activeNonRecurringPlans();
                await cache.set(cacheKey, plans, cacheTTL.API_RESPONSE);
                console.log('✅ Cached active non-recurring plans');
            } catch (error) {
                console.error('Cache SET active non-recurring plans error:', error);
            }
        }

        console.log(`✅ Retrieved ${plans.length} active non-recurring plans`);
        return plans;

    } catch (error) {
        console.error('Error getting active non-recurring plans:', error);
        return null;
    }
};

// Get all active plans (both recurring and non-recurring) with caching
export const getAllActivePlansFromCache = async (forceRefresh: boolean = false): Promise<PlanSelect[] | null> => {
    // First check cache if not forcing refresh
    if (!forceRefresh && cache.isCacheEnabled()) {
        try {
            const cacheKey = cacheKeys.allActivePlans();
            const cachedPlans = await cache.get(cacheKey) as PlanSelect[] | null;
            if (cachedPlans) {
                console.log('✅ Cache HIT for all active plans');
                return cachedPlans;
            }
        } catch (error) {
            console.error('Cache GET all active plans error:', error);
        }
    } else if (forceRefresh && cache.isCacheEnabled()) {
        try {
            const cacheKey = cacheKeys.allActivePlans();
            await cache.delete(cacheKey);
            console.log('🗑️ Cleared all active plans cache');
        } catch (error) {
            console.error('Cache DELETE all active plans error:', error);
        }
    }

    // Get plans from database
    try {
        const plans = await getAllActivePlans();

        if (!plans || plans.length === 0) {
            console.warn('No active plans found');
            return null;
        }

        // Cache the plans
        if (cache.isCacheEnabled()) {
            try {
                const cacheKey = cacheKeys.allActivePlans();
                await cache.set(cacheKey, plans, cacheTTL.API_RESPONSE);
                console.log('✅ Cached all active plans');
            } catch (error) {
                console.error('Cache SET all active plans error:', error);
            }
        }

        console.log(`✅ Retrieved ${plans.length} active plans`);
        return plans;

    } catch (error) {
        console.error('Error getting all active plans:', error);
        return null;
    }
};

// Get processed non-recurring plans (for one-time payment plans)
export const getProcessedNonRecurringPlans = async (forceRefresh: boolean = false): Promise<PlanSelect[] | null> => {
    const plans = await getActiveNonRecurringPlansFromCache(forceRefresh);

    if (!plans) {
        return null;
    }

    // For non-recurring plans, we don't need to group by intervals like recurring plans
    // since they're one-time payments. We'll just sort them by price.
    return plans.sort((a, b) => a.amount - b.amount);
};

// Cache invalidation methods for non-recurring plans
export const deleteNonRecurringPlansCache = async (): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const keys = [
            cacheKeys.activeNonRecurringPlans(),
            cacheKeys.allActivePlans(),
        ];

        await Promise.all(keys.map(key => cache.delete(key)));
        console.log('✅ Deleted non-recurring plans cache');
    } catch (error) {
        console.error('Cache DELETE non-recurring plans error:', error);
    }
};

/**
 * Clear only the active non-recurring plans cache
 */
export const clearActiveNonRecurringPlansCache = async (): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const cacheKey = cacheKeys.activeNonRecurringPlans();
        await cache.delete(cacheKey);
        console.log('✅ Cleared active non-recurring plans cache');
    } catch (error) {
        console.error('Error clearing active non-recurring plans cache:', error);
    }
};