import { NextRequest, NextResponse } from 'next/server';
import { getProcessedPlans } from '@/lib/services/plan_service';
import { initializeProductionCache } from '@/lib/cache-initializer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 在生产环境下，首次调用时初始化缓存
    if (process.env.NODE_ENV === 'production') {
      await initializeProductionCache(forceRefresh);
    }

    // Use the plan service to get processed plans with cache-first logic
    const processedPlans = await getProcessedPlans(forceRefresh);

    if (!processedPlans) {
      return NextResponse.json(
        { error: 'No active plans found' },
        { status: 404 }
      );
    }

    return NextResponse.json(processedPlans);

  } catch (error) {
    console.error('Error fetching processed plans:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}