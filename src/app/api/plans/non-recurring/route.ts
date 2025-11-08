import { NextRequest, NextResponse } from 'next/server';
import { getActiveNonRecurringPlansService } from '@/lib/services/plan_service';

export async function GET(request: NextRequest) {
  try {
    // Fetch non-recurring plans
    const plans = await getActiveNonRecurringPlansService();

    if (!plans) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No non-recurring plans found'
      });
    }

    return NextResponse.json({
      success: true,
      data: plans,
      count: plans.length
    });

  } catch (error) {
    console.error('Error fetching non-recurring plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch non-recurring plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}