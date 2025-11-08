import { getPlanById, getActiveRecurringPlans, getActiveNonRecurringPlans, getAllActivePlans } from '@/db/queries';
import type { PlanSelect } from '@/types/schema';

export interface PlanWithPricing extends PlanSelect {
    monthlyPrice: number;
    quarterlyPrice: number;
    yearlyPrice: number;
    quarterlyDiscount: number;
    yearlyDiscount: number;
}

export const getPlanFromDBById = async (planId: string): Promise<PlanSelect | null> => {
    try {
        const planFromDB = await getPlanById(planId);
        return planFromDB;
    } catch (error) {
        console.error('Database GET plan error:', error);
        return null;
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
            quota: Math.max(...planVariants.map(p => parseInt(p.quota || "0"))).toString(),
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
export const getProcessedPlans = async (): Promise<PlanWithPricing[] | null> => {
    // Get plans from database
    try {
        const plans = await getActiveRecurringPlans();

        if (!plans || plans.length === 0) {
            console.warn('No active plans found');
            return null;
        }

        // Process the plans data
        const processedPlans = processPlansData(plans);

        console.log(`✅ Processed ${processedPlans.length} plans`);
        return processedPlans;

    } catch (error) {
        console.error('Error getting processed plans:', error);
        return null;
    }
};

// ============ NON-RECURRING PLANS METHODS ============

// Get active non-recurring plans
export const getActiveNonRecurringPlansService = async (): Promise<PlanSelect[] | null> => {
    try {
        const plans = await getActiveNonRecurringPlans();

        if (!plans || plans.length === 0) {
            console.warn('No active non-recurring plans found');
            return null;
        }

        console.log(`✅ Retrieved ${plans.length} active non-recurring plans`);
        return plans;

    } catch (error) {
        console.error('Error getting active non-recurring plans:', error);
        return null;
    }
};

// Get all active plans (both recurring and non-recurring)
export const getAllActivePlansService = async (): Promise<PlanSelect[] | null> => {
    try {
        const plans = await getAllActivePlans();

        if (!plans || plans.length === 0) {
            console.warn('No active plans found');
            return null;
        }

        console.log(`✅ Retrieved ${plans.length} active plans`);
        return plans;

    } catch (error) {
        console.error('Error getting all active plans:', error);
        return null;
    }
};

// Get processed non-recurring plans (for one-time payment plans)
export const getProcessedNonRecurringPlans = async (): Promise<PlanSelect[] | null> => {
    const plans = await getActiveNonRecurringPlansService();

    if (!plans) {
        return null;
    }

    // For non-recurring plans, we don't need to group by intervals like recurring plans
    // since they're one-time payments. We'll just sort them by price.
    return plans.sort((a, b) => a.amount - b.amount);
};