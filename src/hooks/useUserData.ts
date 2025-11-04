import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0';


interface UsageData {
  period: string;
  month: string;
  totalTokens: number;
  updatedAt: string | null;

}

// 新的 UserDetail 接口，与后端保持一致
export interface UserDetail {
  userId: number;
  name: string;
  email: string;
  auth0UserId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId: string;
  planId?: string;
  membershipLevel?: string;
  active?: boolean;
  currentEndAt?: Date;
  requestLimit?: number;
  tokenMonthlyUsed?: number;
}

interface UsageApiResponse {
  usage: UsageData;
  userId: number;
  auth0Id: string;
}

type UseUserDataOptions = {
  enableCache?: boolean;
  enabled?: boolean; // enabled 也是可选的
};

export function useUserData(options: UseUserDataOptions = {}) {
  const { enabled = true } = options;

  const { user } = useUser();

  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null); // 主要 UserDetail 数据
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户信息和订阅数据
  const fetchUserData = useCallback(async (forceRefresh = false) => {
    if (!user?.sub) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/user/${user.sub}${forceRefresh ? '?refresh=true' : ''}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // GET 响应格式: 直接返回 UserDetail 对象
      const userDetailData = data.user as UserDetail;

      if (!userDetailData) {
        const res = await fetch(`/api/user/${user.sub}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            nickname: user.nickname,
            name: user.name,
            avatarUrl: user.picture
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to create or update user: ${res.statusText}`);
        }

        const data = await res.json();
        const userDetailData = data.userDetail;

        // 根据返回的结果处理
        if (userDetailData && Object.keys(userDetailData).length > 0) {
          // 用户已存在，继续后续操作
          console.log("User processed:", userDetailData);
          return userDetailData;
        } else {
          // 用户创建成功，执行其他操作
          console.log("New user created:", userDetailData);
          return userDetailData;
        }
      }

      // 验证 UserDetail 数据结构
      if (typeof userDetailData === 'object' && 'userId' in userDetailData) {
        setUserDetail(userDetailData);

        console.log('Fetched user data (GET format - direct UserDetail)');
      } else {
        console.warn('Invalid user data format received:', data);
        setError('Invalid user data format received');
      }

    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }, [user?.sub]);

  // 获取使用数据
  const fetchUsageData = useCallback(async (forceRefresh = false) => {
    if (!user?.sub) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/user/${user.sub}/usage${forceRefresh ? '?refresh=true' : ''}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UsageApiResponse = await response.json();
      if (data.usage) {
        setUsageData(data.usage);
        // console.log('Fetched usage data');
      }
    } catch (err) {
      // console.error('Error fetching usage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }, [user?.sub]);

  // 获取所有数据
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    await Promise.all([
      fetchUserData(forceRefresh),
      fetchUsageData(forceRefresh)
    ]);
  }, [fetchUserData, fetchUsageData]);

  // 用户登录时自动获取数据
  useEffect(() => {
    if (user?.sub && enabled) {
      fetchAllData();
    }
  }, [user?.sub, fetchAllData, enabled]);

  // 计算属性：方便使用的数据
  const isActive = userDetail?.active;
  const requestLimit = userDetail?.requestLimit || 0;
  const tokenMonthlyUsed = userDetail?.tokenMonthlyUsed || 0;
  const membershipLevel = userDetail?.membershipLevel || 'free';

  return {
    // 主要数据：直接返回 UserDetail
    userDetail,
    usageData,
    // 便利属性：从 UserDetail 中提取的常用值
    isActive,
    requestLimit,
    tokenMonthlyUsed,
    membershipLevel,
    loading,
    error,
    refetch: (forceRefresh = true) => fetchAllData(forceRefresh),
    refetchUserData: (forceRefresh = true) => fetchUserData(forceRefresh),
    refetchUsageData: (forceRefresh = true) => fetchUsageData(forceRefresh),
  };
}