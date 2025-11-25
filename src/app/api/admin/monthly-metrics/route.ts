import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAdminStatistics } from '@/lib/services/admin_service';
import { getMonthlyMetrics, getMonthlyMetricsForYear } from '@/db/queries/monthly-metrics';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // First authenticate the admin
    const authResult = await getAdminStatistics(userId);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');
    const year = searchParams.get('year');

    let metricsData;

    // console.log("========enter month metrics============");

    if (year) {
      // Get metrics for specific year
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
        return NextResponse.json(
          { error: 'Invalid year parameter' },
          { status: 400 }
        );
      }
      metricsData = await getMonthlyMetricsForYear(yearNum);
    } else {
      // Get metrics for past N months
      if (isNaN(months) || months < 1 || months > 24) {
        return NextResponse.json(
          { error: 'Months parameter must be between 1 and 24' },
          { status: 400 }
        );
      }
      metricsData = await getMonthlyMetrics(months);
    }

    // console.log(metricsData, authResult.data);

    return NextResponse.json({
      success: true,
      data: metricsData,
      auth: authResult.data
    });

  } catch (error) {
    console.error('Error fetching monthly metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
