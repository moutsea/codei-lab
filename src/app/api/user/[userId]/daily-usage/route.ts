import { NextRequest, NextResponse } from 'next/server';
import {
  getDailyUserUsageByUserAndDateService,
  getDailyUserUsageByDateRangeService,
  upsertDailyUserUsageService
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
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const type = searchParams.get('type') || 'current';

    let data;

    switch (type) {
      case 'current':
        // Get current month usage (sum of daily usage for current month)
        const currentDate = new Date();
        const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM
        const startDate = new Date(currentMonth + '-01');
        const endDate = new Date(currentMonth + '-31');

        const currentMonthUsage = await getDailyUserUsageByDateRangeService(
          startDate.toISOString().slice(0, 10),
          endDate.toISOString().slice(0, 10),
          userId
        );

        const totalTokens = currentMonthUsage.reduce((sum, usage) => sum + usage.totalTokens, 0);
        data = { totalTokens, dailyUsage: currentMonthUsage };
        break;

      case 'trends':
        // Get usage trends for specified days
        const days = parseInt(searchParams.get('days') || '30');
        const endDateTrend = new Date();
        const startDateTrend = new Date();
        startDateTrend.setDate(endDateTrend.getDate() - days + 1);

        const trends = await getDailyUserUsageByDateRangeService(
          startDateTrend.toISOString().slice(0, 10),
          endDateTrend.toISOString().slice(0, 10),
          userId
        );

        data = trends;
        break;

      case 'total':
        // Get total usage for date range
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        if (!startDateParam || !endDateParam) {
          return NextResponse.json(
            { error: 'startDate and endDate parameters are required for total type' },
            { status: 400 }
          );
        }

        const totalUsageData = await getDailyUserUsageByDateRangeService(
          startDateParam,
          endDateParam,
          userId
        );

        const totalTokensSum = totalUsageData.reduce((sum, usage) => sum + usage.totalTokens, 0);
        data = { totalTokens: totalTokensSum, records: totalUsageData };
        break;

      case 'date':
        // Get specific date usage record
        const date = searchParams.get('date');
        if (!date) {
          return NextResponse.json(
            { error: 'Date parameter is required' },
            { status: 400 }
          );
        }

        const usageData = await getDailyUserUsageByUserAndDateService(userId, date);
        data = usageData;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json({ data, type, userId });
  } catch (error) {
    console.error('Error fetching daily usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { totalTokens, usageDate } = body;

    if (!totalTokens || typeof totalTokens !== 'number' || totalTokens < 0) {
      return NextResponse.json(
        { error: 'Invalid totalTokens value' },
        { status: 400 }
      );
    }

    const date = usageDate ? new Date(usageDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    const usage = await upsertDailyUserUsageService(userId, date, totalTokens);

    if (!usage) {
      return NextResponse.json(
        { error: 'Failed to create or update daily usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usage: {
        id: usage.id,
        userId: usage.userId,
        date: usage.date,
        totalTokens: usage.totalTokens,
        updatedAt: usage.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating daily usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}