import { NextRequest, NextResponse } from 'next/server';
import { getUserByAuth0Id } from '@/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auth0Id: string }> }
) {
  try {
    const { auth0Id } = await params;

    if (!auth0Id) {
      return NextResponse.json(
        { error: 'Auth0 ID is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await getUserByAuth0Id(auth0Id);

    if (!user) {
      return NextResponse.json({
        isAmin: false
      });
    }

    // Check if user is admin
    return NextResponse.json({
      isAdmin: user.isAdmin || false
    });

  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}