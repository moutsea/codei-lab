import { getTotalRevenue, getMonthlyRevenue, getTotalRevenueByCurrency, getMonthlyRevenueByCurrency } from '@/db/queries/payments';
import { getTotalTokensUsed, getTokensUsedThisMonth } from '@/db/queries/monthly-api-usage';
import { getSubscriptionStats, getSubscriptionsThisMonth } from '@/db/queries/subscriptions';
import { getUsersCount, getNewUsersThisMonth } from '@/db/queries/users';
import type { UserSelect } from '@/db/schema';

export interface AdminServiceError {
  success: false;
  error: string;
  status: number;
}

export interface AdminAuthSuccess {
  success: true;
  user: UserSelect;
}

export interface AdminStatsSuccess {
  success: true;
  data: {
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
  };
}

type AdminAuthResult = AdminServiceError | AdminAuthSuccess;
type AdminStatsResult = AdminServiceError | AdminStatsSuccess;


// Admin authentication service
export async function authenticateAdmin(auth0Id: string): Promise<AdminAuthResult> {
  try {
    const { getUserByAuth0Id } = await import('@/db/queries');
    const user = await getUserByAuth0Id(auth0Id);

    if (!user) {
      return { success: false, error: 'User not found', status: 404 };
    }

    if (!user.isAdmin) {
      return { success: false, error: 'Admin access required', status: 403 };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error authenticating admin:', error);
    return { success: false, error: 'Internal server error', status: 500 };
  }
}

// Get all admin statistics in one service call
export async function getAdminStatistics(auth0Id: string): Promise<AdminStatsResult> {
  try {
    // First authenticate the admin
    const authResult = await authenticateAdmin(auth0Id);
    if (!authResult.success) {
      return authResult;
    }

    // Get all statistics using query functions
    const [
      totalUsers,
      newUsersThisMonth,
      totalRevenue,
      monthlyRevenue,
      totalRevenueBreakdown,
      monthlyRevenueBreakdown,
      totalTokens,
      tokensThisMonth,
      subscriptionStats,
      subscriptionsThisMonth
    ] = await Promise.all([
      getUsersCount(),
      getNewUsersThisMonth(),
      getTotalRevenue(),
      getMonthlyRevenue(),
      getTotalRevenueByCurrency(),
      getMonthlyRevenueByCurrency(),
      getTotalTokensUsed(),
      getTokensUsedThisMonth(),
      getSubscriptionStats(),
      getSubscriptionsThisMonth()
    ]);

    return {
      success: true,
      data: {
        users: {
          total: totalUsers,
          growth: String(newUsersThisMonth), // Show new users this month as string
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          totalByCurrency: totalRevenueBreakdown.currencies,
          monthlyByCurrency: monthlyRevenueBreakdown.currencies
        },
        usage: {
          totalTokens: totalTokens,
          monthlyTokens: tokensThisMonth, // Show tokens used this month instead of active users
        },
        subscriptions: {
          active: subscriptionStats.active,
          total: subscriptionStats.total,
          monthlySubscriptions: subscriptionsThisMonth
        }
      }
    };
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    return { success: false, error: 'Internal server error', status: 500 };
  }
}
