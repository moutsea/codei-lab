import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

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
    totalTokens: number;
    monthlyTokens: number;
  };
  subscriptions: {
    active: number;
    total: number;
    monthlySubscriptions: number;
  };
}

export interface MonthlyMetrics {
  month: string;
  users: number;
  revenue: number;
  revenueByCurrency: {
    [currency: string]: {
      amount: number;
      currency: string;
    };
  };
  tokens: number;
  subscriptions: number;
}

export interface UseAdminOptions {
  enableCache?: boolean;
  cacheTimeout?: number; // in milliseconds
}

export interface UseAdminReturn {
  isAdmin: boolean | null;
  loading: boolean;
  error: string | null;
  adminStats: AdminStats | null;
  monthlyMetrics: MonthlyMetrics[];
  checkAdminStatus: () => Promise<void>;
  fetchAdminStats: () => Promise<void>;
  fetchMonthlyMetrics: (months?: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

type AdminCacheEntry = {
  value: boolean;
  timestamp: number;
  promise?: Promise<boolean>;
};

const adminStatusCache = new Map<string, AdminCacheEntry>();

// Global admin status to avoid duplicate checks across hook instances
let globalAdminStatus: { isAdmin: boolean | null; userId: string | null; timestamp: number } = {
  isAdmin: null,
  userId: null,
  timestamp: 0
};

let globalAdminCheckPromise: Promise<boolean> | null = null;

export function useAdmin(options: UseAdminOptions = {}): UseAdminReturn {
  const { enableCache = true, cacheTimeout = 5 * 60 * 1000 } = options;
  const { data: session } = useSession();
  const user = session?.user;
  const userId = user?.id;

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAdminStats(null);
      setMonthlyMetrics([]);
    }
  }, [userId]);

  const loading = useMemo(() => {
    if (adminLoading) return true;
    if (isAdmin) {
      return !adminStats || monthlyMetrics.length === 0;
    }
    return false;
  }, [adminLoading, isAdmin, adminStats, monthlyMetrics.length]);

  const error = adminError || fetchError;

  const checkAdminStatus = useCallback(async () => {
    if (!userId) {
      setIsAdmin(null);
      return;
    }

    // Check global cache first to avoid duplicate requests across hook instances
    const now = Date.now();
    if (globalAdminStatus.userId === userId &&
        globalAdminStatus.isAdmin !== null &&
        now - globalAdminStatus.timestamp < cacheTimeout) {
      setIsAdmin(globalAdminStatus.isAdmin);
      return;
    }

    // If another instance is currently checking, wait for that result
    if (globalAdminCheckPromise && globalAdminStatus.userId === userId) {
      try {
        const isAdminValue = await globalAdminCheckPromise;
        setIsAdmin(isAdminValue);
        return;
      } catch (err) {
        // Continue with normal error handling if global promise failed
      }
    }

    setAdminLoading(true);
    setAdminError(null);

    // Create the admin check promise and store it globally
    globalAdminCheckPromise = (async () => {
      const response = await fetch(`/api/user/${userId}/admin-check`);
      if (!response.ok) {
        throw new Error(`Failed to check admin status: ${response.status}`);
      }

      const data = await response.json();
      return Boolean(data.isAdmin);
    })();

    try {
      const isAdminValue = await globalAdminCheckPromise;
      setIsAdmin(isAdminValue);

      // Update global cache
      globalAdminStatus = {
        isAdmin: isAdminValue,
        userId,
        timestamp: now
      };

      // Update local cache as well
      if (enableCache) {
        const cacheKey = `admin-status:${userId}`;
        adminStatusCache.set(cacheKey, { value: isAdminValue, timestamp: now });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check admin status';
      setAdminError(message);
      setIsAdmin(false);

      // Clear global cache on error
      globalAdminStatus = { isAdmin: false, userId, timestamp: 0 };
    } finally {
      setAdminLoading(false);
      globalAdminCheckPromise = null;
    }
  }, [userId, enableCache, cacheTimeout]);

  useEffect(() => {
    if (userId) {
      checkAdminStatus();
    } else {
      setIsAdmin(null);
    }
  }, [userId, checkAdminStatus]);

  const fetchAdminStats = useCallback(async (): Promise<void> => {
    if (!userId || !isAdmin) {
      return;
    }

    try {
      setFetchError(null);

      const response = await fetch('/api/admin/stats', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch admin stats: ${response.status}`);
      }

      const data = await response.json();
      setAdminStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch admin statistics';
      setFetchError(errorMessage);
    }
  }, [userId, isAdmin]);

  const fetchMonthlyMetrics = useCallback(async (months: number = 12): Promise<void> => {
    if (!userId || !isAdmin) {
      return;
    }

    try {
      setFetchError(null);

      const response = await fetch(`/api/admin/monthly-metrics?months=${months}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch monthly metrics: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setMonthlyMetrics(data.data);
        if (data.auth) {
          setAdminStats(data.auth);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch monthly metrics';
      setFetchError(errorMessage);
    }
  }, [userId, isAdmin]);

  const refreshData = useCallback(async (): Promise<void> => {
    if (isAdmin) {
      await Promise.all([fetchAdminStats(), fetchMonthlyMetrics()]);
    }
  }, [fetchAdminStats, fetchMonthlyMetrics, isAdmin]);

  return {
    isAdmin,
    loading,
    error,
    adminStats,
    monthlyMetrics,
    checkAdminStatus,
    fetchAdminStats,
    fetchMonthlyMetrics,
    refreshData,
  };
}

export function useAdminStatus(options: UseAdminOptions = {}) {
  const { isAdmin, loading, error, checkAdminStatus } = useAdmin(options);

  return {
    isAdmin,
    loading,
    error,
    checkAdminStatus,
  };
}

export function useAdminDashboard(months: number = 12, options: UseAdminOptions = {}) {
  const {
    isAdmin,
    loading,
    error,
    adminStats,
    monthlyMetrics,
    fetchAdminStats,
    fetchMonthlyMetrics,
    refreshData,
  } = useAdmin(options);

  useEffect(() => {
    if (isAdmin === true && !adminStats && monthlyMetrics.length === 0) {
      fetchAdminStats();
      fetchMonthlyMetrics(months);
    }
  }, [isAdmin, adminStats, monthlyMetrics.length, fetchAdminStats, fetchMonthlyMetrics, months]);

  return {
    isAdmin,
    loading,
    error,
    adminStats,
    monthlyMetrics,
    refreshData: () => {
      refreshData();
    },
    refetchStats: fetchAdminStats,
    refetchMetrics: () => fetchMonthlyMetrics(months),
  };
}
