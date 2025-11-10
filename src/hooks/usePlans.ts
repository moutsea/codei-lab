'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PlanWithPricing {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  trialPeriodDays: number | null;
  active: boolean;
  stripeProductId: string | null;
  stripePriceId: string | null;
  requestLimit: number;
  modelAccess: string[] | null;
  features: string[] | null;
  membershipLevel: string,
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  quarterlyDiscount: number;
  yearlyDiscount: number;
}

export type BillingInterval = 'month' | 'quarter' | 'year';
export type PlanType = 'frontpage' | 'renew' | 'extra';

export function usePlans() {
  const [frontpagePlans, setFrontpagePlans] = useState<PlanWithPricing[]>([]);
  const [renewPlans, setRenewPlans] = useState<PlanWithPricing[]>([]);
  const [extraPlans, setExtraPlans] = useState<PlanWithPricing[]>([]);
  const [loading, setLoading] = useState<Record<PlanType, boolean>>({
    frontpage: true,
    renew: true,
    extra: true,
  });
  const [error, setError] = useState<Record<PlanType, string | null>>({
    frontpage: null,
    renew: null,
    extra: null,
  });
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('month');

  const fetchPlansByType = useCallback(async (type: PlanType, forceRefresh = false) => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      setError(prev => ({ ...prev, [type]: null }));

      const response = await fetch(`/api/plans?type=${type}${forceRefresh ? '&refresh=true' : ''}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} plans`);
      }

      const plans: PlanWithPricing[] = await response.json();

      switch (type) {
        case 'frontpage':
          setFrontpagePlans(plans);
          break;
        case 'renew':
          setRenewPlans(plans);
          break;
        case 'extra':
          setExtraPlans(plans);
          break;
      }
    } catch (err) {
      console.error(`Error fetching ${type} plans:`, err);
      setError(prev => ({
        ...prev,
        [type]: err instanceof Error ? err.message : `Failed to fetch ${type} plans`
      }));

      // Set empty array on error
      switch (type) {
        case 'frontpage':
          setFrontpagePlans([]);
          break;
        case 'renew':
          setRenewPlans([]);
          break;
        case 'extra':
          setExtraPlans([]);
          break;
      }
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  const fetchPlans = useCallback(async (forceRefresh = false) => {
    // Fetch all plan types in parallel
    await Promise.all([
      fetchPlansByType('frontpage', forceRefresh),
      fetchPlansByType('renew', forceRefresh),
      fetchPlansByType('extra', forceRefresh),
    ]);
  }, [fetchPlansByType]);

  // Legacy method for backward compatibility - maps to frontpage plans
  const fetchLegacyPlans = useCallback(async (forceRefresh = false) => {
    return fetchPlansByType('frontpage', forceRefresh);
  }, [fetchPlansByType]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);
  const getPlanPrice = (plan: PlanWithPricing) => {
    switch (selectedInterval) {
      case 'quarter':
        return plan.quarterlyPrice;
      case 'year':
        return plan.yearlyPrice;
      default:
        return plan.monthlyPrice;
    }
  };

  const getPlanDiscount = (plan: PlanWithPricing) => {
    switch (selectedInterval) {
      case 'quarter':
        return plan.quarterlyDiscount;
      case 'year':
        return plan.yearlyDiscount;
      default:
        return 0;
    }
  };

  const getStripePriceId = (plan: PlanWithPricing) => {
    // 根据选择的周期返回对应的price ID
    // 这里需要从原始数据中找到对应的price ID
    // 简化实现，实际应该从原始数据中查找
    return plan.stripePriceId;
  };

  const clearCache = useCallback(async () => {
    try {
      // 通过 API 调用清理缓存
      await Promise.all([
        fetch('/api/plans/processed/clear', { method: 'POST' }),
        fetch('/api/plans/cache/clear', { method: 'POST' }),
      ]);
      console.log('Cleared plans cache');
    } catch (error) {
      console.error('Failed to clear plans cache:', error);
    }
  }, []);

  // Check if any plan type is loading
  const isAnyLoading = loading.frontpage || loading.renew || loading.extra;

  // Get combined loading state for backward compatibility
  const loadingState = isAnyLoading;

  return {
    // New plan-specific properties
    frontpagePlans,
    renewPlans,
    extraPlans,
    loading,
    error,

    // Backward compatibility properties
    plans: frontpagePlans, // Map to frontpage plans for existing code
    loadingState, // Combined loading state

    // Individual loading states for specific plan types
    isLoading: {
      frontpage: loading.frontpage,
      renew: loading.renew,
      extra: loading.extra,
    },

    // Individual error states for specific plan types
    errors: {
      frontpage: error.frontpage,
      renew: error.renew,
      extra: error.extra,
    },

    selectedInterval,
    setSelectedInterval,
    getPlanPrice,
    getPlanDiscount,
    getStripePriceId,

    // Refetch methods
    refetch: () => fetchPlansByType('frontpage', true), // Backward compatibility
    refetchFrontpage: () => fetchPlansByType('frontpage', true),
    refetchRenew: () => fetchPlansByType('renew', true),
    refetchExtra: () => fetchPlansByType('extra', true),
    refetchAll: () => fetchPlans(true),

    clearCache,
  };
}