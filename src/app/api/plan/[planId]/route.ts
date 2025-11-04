import { NextRequest, NextResponse } from 'next/server';
import { getPlanFromDBById } from '@/lib/services/plan_service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Use the plan service which handles cache-first with database fallback and caching
    const plan = await getPlanFromDBById(planId);

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Retrieved plan ${planId}`);

    return NextResponse.json(plan);

  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}