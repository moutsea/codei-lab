import { getPlanById, getPlansByType, getFrontpagePlans } from '@/db/queries';
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

/**
 * Get plans by type from database
 */
export const getPlansFromDBByType = async (type: string): Promise<PlanSelect[]> => {
    try {
        const plans = await getPlansByType(type);
        return plans;
    } catch (error) {
        console.error('Database GET plans by type error:', error);
        return [];
    }
}

/**
 * Get frontpage plans (pay or sub type) from database
 */
export const getFrontpagePlansFromDB = async (): Promise<PlanSelect[]> => {
    try {
        const plans = await getFrontpagePlans();
        return plans;
    } catch (error) {
        console.error('Database GET frontpage plans error:', error);
        return [];
    }
}

