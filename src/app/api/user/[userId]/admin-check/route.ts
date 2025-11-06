import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({
        isAdmin: false
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