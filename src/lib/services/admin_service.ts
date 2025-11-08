import { getTotalRevenue, getMonthlyRevenue, getTotalRevenueByCurrency, getMonthlyRevenueByCurrency } from '@/db/queries/payments';
import { getQuotaUsedThisMonth, getTotalQuotaUsed } from '@/db/queries/monthly-api-usage';
import { getSubscriptionStats, getSubscriptionsThisMonth } from '@/db/queries/subscriptions';
import { getUsersCount, getNewUsersThisMonth, getUserById } from '@/db/queries/users';
import type {
  AdminAuthResult,
  AdminStatsResult
} from '@/types/admin';


// Admin authentication service
export async function authenticateAdmin(userId: string): Promise<AdminAuthResult> {
  try {
    const user = await getUserById(userId);

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
export async function getAdminStatistics(userId: string): Promise<AdminStatsResult> {
  try {
    // First authenticate the admin
    const authResult = await authenticateAdmin(userId);
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
      totalQuotaUsed,
      quotaUsedThisMonth,
      subscriptionStats,
      subscriptionsThisMonth
    ] = await Promise.all([
      getUsersCount(),
      getNewUsersThisMonth(),
      getTotalRevenue(),
      getMonthlyRevenue(),
      getTotalRevenueByCurrency(),
      getMonthlyRevenueByCurrency(),
      getTotalQuotaUsed(),
      getQuotaUsedThisMonth(),
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
          totalQuotaUsed: totalQuotaUsed,
          monthlyQuotaUsed: quotaUsedThisMonth, // Show tokens used this month instead of active users
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
