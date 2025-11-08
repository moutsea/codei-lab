import { NextRequest, NextResponse } from 'next/server';
import { getAdminStatistics } from '@/lib/services/admin_service';
import type { AdminServiceError, AdminStatsSuccess } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Get user from Auth0 ID
    const auth0Id = request.headers.get('x-user-id');
    if (!auth0Id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call service layer - API only calls services, never direct DB
    const result = await getAdminStatistics(auth0Id);

    if (!result.success) {
      const errorResult = result as AdminServiceError;
      return NextResponse.json(
        { error: errorResult.error },
        { status: errorResult.status || 500 }
      );
    }

    // For success case, result has data property
    if ('data' in result) {
      const successResult = result as AdminStatsSuccess;
      return NextResponse.json(successResult.data);
    } else {
      return NextResponse.json(
        { error: 'Unexpected response format' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}