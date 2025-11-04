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


export function usePlans() {
  const [plans, setPlans] = useState<PlanWithPricing[]>([]);
  const [nonRecurringPlans, setNonRecurringPlans] = useState<PlanWithPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonRecurringLoading, setNonRecurringLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonRecurringError, setNonRecurringError] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('month');

  const fetchPlans = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // 从API获取处理好的数据，API 内部会处理 Redis 缓存和数据处理
      const response = await fetch(`/api/plans/processed${forceRefresh ? '?refresh=true' : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const processedPlans: PlanWithPricing[] = await response.json();
      setPlans(processedPlans);
    } catch (err) {
      // console.error('Error fetching plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNonRecurringPlans = useCallback(async (forceRefresh = false) => {
    try {
      setNonRecurringLoading(true);
      setNonRecurringError(null);

      // Fetch non-recurring plans from API
      const response = await fetch(`/api/plans/non-recurring${forceRefresh ? '?forceRefresh=true' : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch non-recurring plans');
      }

      const data = await response.json();

      // console.log(data);
      const nonRecurringPlansData = data.success && data.data ? data.data : [];
      setNonRecurringPlans(nonRecurringPlansData);
    } catch (err) {
      console.error('Error fetching non-recurring plans:', err);
      setNonRecurringError(err instanceof Error ? err.message : 'Failed to fetch non-recurring plans');
      setNonRecurringPlans([]);
    } finally {
      setNonRecurringLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchNonRecurringPlans();
  }, [fetchPlans, fetchNonRecurringPlans]);
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
      // 通过 API 调用清理处理过的缓存
      await fetch('/api/plans/processed/clear', { method: 'POST' });
      console.log('Cleared processed plans cache');
    } catch (error) {
      console.error('Failed to clear processed plans cache:', error);
    }
  }, []);

  return {
    plans,
    nonRecurringPlans,
    loading,
    nonRecurringLoading,
    error,
    nonRecurringError,
    selectedInterval,
    setSelectedInterval,
    getPlanPrice,
    getPlanDiscount,
    getStripePriceId,
    refetch: () => fetchPlans(true),
    refetchNonRecurring: () => fetchNonRecurringPlans(true),
    refetchAll: () => {
      fetchPlans(true);
      fetchNonRecurringPlans(true);
    },
    clearCache,
  };
}