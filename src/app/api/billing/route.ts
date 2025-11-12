import { NextRequest, NextResponse } from 'next/server';
import { getUserPaymentsPaginated } from '@/lib/services/payment_service';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // Get the session to authenticate the user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const orderBy = (searchParams.get('orderBy') || 'createdAt') as 'createdAt' | 'amount' | 'status';
    const orderDirection = (searchParams.get('orderDirection') || 'desc') as 'asc' | 'desc';

    // Fetch payments data
    const result = await getUserPaymentsPaginated(session.user.id, {
      page,
      limit,
      orderBy,
      orderDirection
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}