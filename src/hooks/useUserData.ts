import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserDetail, TopUpPurchaseSelect } from '@/types';


interface UsageData {
  period: string;
  month: string;
  totalQuotaUsed: number;
  updatedAt: string | null;
}

interface DailyUsageItem {
  date: string;
  totalTokens: number;
}

interface DailyUsageResponse {
  usage: {
    dailyUsage: DailyUsageItem[];
  };
}

interface UsageApiResponse {
  usage: UsageData;
  userId: string;
  auth0Id: string;
}

interface TopUpApiResponse {
  success: boolean;
  data: TopUpPurchaseSelect | null;
}

type UseUserDataOptions = {
  enableCache?: boolean;
  enabled?: boolean; // enabled 也是可选的
};

export function useUserData(options: UseUserDataOptions = {}) {
  const { enabled = true } = options;

  const { data: session } = useSession();
  const user = session?.user;

  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null); // 主要 UserDetail 数据
  const [topUpRecord, setTopUpRecord] = useState<TopUpPurchaseSelect | null>(null); // Top-up record
  const [loadingState, setLoadingState] = useState<boolean>(enabled); // internal loading flag
  const [hasFetchedOnce, setHasFetchedOnce] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户信息和订阅数据
  const fetchUserData = useCallback(async (forceRefresh = false): Promise<UserDetail | null> => {
    if (!user?.id) return null;

    const response = await fetch(`/api/user/${user.id}${forceRefresh ? '?refresh=true' : ''}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let userDetailData = data.user as UserDetail | null;

    if (!userDetailData) {
      const res = await fetch(`/api/user/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: user.name,
          name: user.name,
          avatarUrl: user.image
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create or update user: ${res.statusText}`);
      }

      const patchData = await res.json();
      userDetailData = patchData.userDetail as UserDetail | null;
    }

    if (userDetailData && typeof userDetailData === 'object' && 'userId' in userDetailData) {
      return userDetailData;
    }

    console.warn('Invalid user data format received:', data);
    throw new Error('Invalid user data format received');
  }, [user?.id, user?.image, user?.name]);

  // 获取使用数据
  const fetchUsageData = useCallback(async (forceRefresh = false): Promise<UsageData | null> => {
    if (!user?.id) return null;

    const response = await fetch(`/api/user/${user.id}/usage${forceRefresh ? '?refresh=true' : ''}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: UsageApiResponse = await response.json();
    return data.usage ?? null;
  }, [user?.id]);

  // 获取每日使用数据（带日期范围）
  const fetchDailyUsageData = useCallback(async (startDate: string, endDate: string) => {
    if (!user?.id) return null;

    try {
      const response = await fetch(
        `/api/user/${user.id}/usage?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DailyUsageResponse = await response.json();
      return data.usage?.dailyUsage || [];
    } catch (err) {
      console.error('Error fetching daily usage data:', err);
      return [];
    }
  }, [user?.id]);

  // 获取充值记录数据
  const fetchTopUpData = useCallback(async (forceRefresh = false): Promise<TopUpPurchaseSelect | null> => {
    if (!user?.id) return null;

    const response = await fetch(`/api/user/${user.id}/topup${forceRefresh ? '?refresh=true' : ''}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TopUpApiResponse = await response.json();
    return data.success ? data.data : null;
  }, [user?.id]);

  // 获取所有数据
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    if (!enabled || !user?.id) {
      return;
    }

    setLoadingState(true);
    setHasFetchedOnce(false);
    setError(null);

    try {
      const [detail, usage, topUp] = await Promise.all([
        fetchUserData(forceRefresh),
        fetchUsageData(forceRefresh),
        fetchTopUpData(forceRefresh)
      ]);

      setUserDetail(detail);
      setUsageData(usage);
      setTopUpRecord(topUp);
    } catch (err) {
      console.error('Error fetching all data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoadingState(false);
      setHasFetchedOnce(true);
    }
  }, [enabled, user?.id, fetchUserData, fetchUsageData, fetchTopUpData]);

  // 用户登录时自动获取数据
  useEffect(() => {
    if (!enabled) {
      setLoadingState(false);
      setHasFetchedOnce(true);
      return;
    }

    if (!user?.id) {
      setUsageData(null);
      setUserDetail(null);
      setTopUpRecord(null);
      setHasFetchedOnce(false);
      setLoadingState(true);
      return;
    }

    fetchAllData();
  }, [user?.id, fetchAllData, enabled]);

  // 计算属性：方便使用的数据
  const isActive = userDetail?.active;
  const quota = userDetail?.quota || "0";
  const quotaMonthlyUsed = userDetail?.quotaMonthlyUsed || "0";
  const membershipLevel = userDetail?.membershipLevel || 'free';

  return {
    // 主要数据：直接返回 UserDetail
    userDetail,
    usageData,
    topUpRecord, // 更新：充值记录数据 (单个记录)
    // 便利属性：从 UserDetail 中提取的常用值
    isActive,
    quota: parseFloat(quota),
    quotaMonthlyUsed: parseFloat(quotaMonthlyUsed),
    membershipLevel,
    loading: !hasFetchedOnce || loadingState,
    error,
    refetch: (forceRefresh = true) => fetchAllData(forceRefresh),
    fetchDailyUsageData, // 新增：获取每日使用数据的函数
  };
}