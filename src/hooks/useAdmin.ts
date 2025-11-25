import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { MonthlyMetricsData } from '@/types/db';

export interface AdminStats {
  users: {
    total: number;
    growth: string;
  };
  revenue: {
    total: number;
    monthly: number;
    totalByCurrency: {
      [currency: string]: {
        amount: number;
        currency: string;
        count: number;
      };
    };
    monthlyByCurrency: {
      [currency: string]: {
        amount: number;
        currency: string;
        count: number;
      };
    };
  };
  usage: {
    inputTokens: number;
    cachedTokens: number;
    outputTokens: number;
  };
  quota: {
    used: string;
  };
  subscriptions: {
    active: number;
    total: number;
    monthlySubscriptions: number;
  };
}

export type MonthlyMetrics = MonthlyMetricsData;

interface AdminHookResult {
  isAdmin: boolean | null;
  adminStats: AdminStats | null;
  monthlyMetrics: MonthlyMetrics[];
  loading: boolean;
}

export function useAdmin(months: number = 12): AdminHookResult {
  const { status } = useSession();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const resetAdminState = () => {
    setIsAdmin(false);
    setAdminStats(null);
    setMonthlyMetrics([]);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const loadAdminData = async () => {

      setLoading(true);

      try {
        const statusResponse = await fetch('/api/admin/status', {
          credentials: 'include',
        });

        if (!statusResponse.ok) {
          if (statusResponse.status === 401 || statusResponse.status === 403) {
            resetAdminState();
            return;
          }
          throw new Error(`Failed to check admin status: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        if (cancelled) return;

        if (!statusData.isAdmin) {
          resetAdminState();
          return;
        }

        const metricsResponse = await fetch(`/api/admin/monthly-metrics?months=${months}`, {
          credentials: 'include',
        });

        if (!metricsResponse.ok) {
          if (metricsResponse.status === 401 || metricsResponse.status === 403) {
            resetAdminState();
            return;
          }
          throw new Error(`Failed to fetch monthly metrics: ${metricsResponse.status}`);
        }

        const metricsPayload = await metricsResponse.json();
        if (cancelled) return;

        if (!metricsPayload.success) {
          resetAdminState();
          return;
        }

        const metricsData: MonthlyMetrics[] = metricsPayload.success
          ? (metricsPayload.data as MonthlyMetricsData[])
          : [];
        const statsData: AdminStats | null = metricsPayload.auth ?? null;

        setIsAdmin(true);
        setAdminStats(statsData);
        setMonthlyMetrics(metricsData);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load admin dashboard data:', error);
        resetAdminState();
      }
    };

    loadAdminData();

    return () => {
      cancelled = true;
    };
  }, [status, months]);

  return {
    isAdmin,
    adminStats,
    monthlyMetrics,
    loading,
  };
}

export function useAdminDashboard(months: number = 12): AdminHookResult {
  return useAdmin(months);
}

export function useAdminStatus() {
  const { status } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const checkStatus = async () => {
      if (status === 'loading') {
        setLoading(true);
        return;
      }

      if (status === 'unauthenticated') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (status !== 'authenticated') {
        return;
      }

      setLoading(true);

      try {
        const response = await fetch('/api/admin/status', {
          credentials: 'include',
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setIsAdmin(false);
            return;
          }
          throw new Error(`Failed to check admin status: ${response.status}`);
        }

        const data = await response.json();
        if (cancelled) return;

        setIsAdmin(Boolean(data.isAdmin));
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load admin status:', error);
        setIsAdmin(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkStatus();

    return () => {
      cancelled = true;
    };
  }, [status]);

  return { isAdmin, loading };
}
