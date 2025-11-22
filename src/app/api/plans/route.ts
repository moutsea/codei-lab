import { NextRequest, NextResponse } from 'next/server';
import { getFrontpagePlansFromDB, getPlansFromDBByType } from '@/lib/services/plan_service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let plans;

    switch (type) {
      case 'frontpage':
        plans = await getFrontpagePlansFromDB();
        break;

      case 'extra':
        plans = await getPlansFromDBByType('extra');
        break;

      case 'renew':
        plans = await getPlansFromDBByType('renew');
        break;

      case 'pay':
        plans = await getPlansFromDBByType('pay');
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Must be: frontpage, extra, or renew' },
          { status: 400 }
        );
    }

    if (!plans || plans.length === 0) {
      return NextResponse.json(
        { error: `No plans found for type: ${type}` },
        { status: 404 }
      );
    }

    return NextResponse.json(plans);

  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}