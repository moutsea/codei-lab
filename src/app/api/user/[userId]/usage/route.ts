import { NextRequest, NextResponse } from 'next/server';
import {
  getDailyUserUsageByDateRangeService,
  getRecentMonthlyUserUsageService
} from '@/lib/services/token_usage_service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);

    if (!userId) {
      return NextResponse.json(
        {
          noUsage: true,
          usage: null
        }
      );
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let usageData;

    if (startDate && endDate) {
      // Get usage for specified date range using daily usage data
      const dailyUsage = await getDailyUserUsageByDateRangeService(
        startDate,
        endDate,
        userId
      );

      // Calculate aggregated statistics
      const totalQuotaUsed = dailyUsage.reduce((sum, usage) => sum + parseFloat(usage.quotaUsed), 0);
      const averageDailyUsage = dailyUsage.length > 0 ? Math.round(totalQuotaUsed / dailyUsage.length) : 0;
      const peakDailyUsage = dailyUsage.length > 0 ? Math.max(...dailyUsage.map(u => parseFloat(u.quotaUsed))) : 0;

      usageData = {
        period: 'custom',
        startDate,
        endDate,
        totalQuotaUsed,
        averageDailyUsage,
        peakDailyUsage,
        dailyUsage,
        recordCount: dailyUsage.length
      };
    } else {
      // Get current month usage using monthly usage data
      const recentMonthlyUsage = await getRecentMonthlyUserUsageService(userId, 1);

      if (recentMonthlyUsage.length > 0) {
        const currentMonthUsage = recentMonthlyUsage[0];
        usageData = {
          period: 'current_month',
          month: currentMonthUsage.month,
          totalQuotaUsed: currentMonthUsage.quotaUsed,
          updatedAt: currentMonthUsage.updatedAt
        };
      } else {
        usageData = {
          period: 'current_month',
          month: new Date().toISOString().slice(0, 7),
          totalTokens: 0,
          updatedAt: null
        };
      }
    }

    const responseData = {
      usage: usageData,
      userId
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching user usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}