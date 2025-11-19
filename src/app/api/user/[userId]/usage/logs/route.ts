import { NextRequest, NextResponse } from 'next/server';
import { getDailyApiUsageStatsByUserIdPaginatedService } from '@/lib/services/token_usage_service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get('limit'));
    const offsetParam = Number(searchParams.get('offset'));

    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.floor(limitParam), 1), 60)
      : 30;
    const offset = Number.isFinite(offsetParam) && offsetParam > 0
      ? Math.floor(offsetParam)
      : 0;

    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const data = await getDailyApiUsageStatsByUserIdPaginatedService(
      userId,
      startDate,
      endDate,
      limit,
      offset
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching usage logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
