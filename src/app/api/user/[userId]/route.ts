import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromDBById,
  getUserDetailByIdWithCache,
  deleteUserDetailCache
} from '@/lib/services/user_service';

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

    const userDetail = await getUserDetailByIdWithCache(userId);

    if (!userDetail) {
      console.log(`User not found for user ID: ${userId}`);
      return NextResponse.json({ user: null, isNewUser: true });
    }

    // Existing user - add isNewUser flag
    return NextResponse.json({
      user: userDetail,
      isNewUser: false
    });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { email, nickname, name, avatarUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Note: User updates should be handled through the authentication flow
    // This PATCH endpoint can be used for administrative updates
    // For now, we'll clear the cache to ensure fresh data on next request
    await deleteUserDetailCache(userId);
    console.log(`✅ Cleared user detail cache for userId: ${userId}`);

    // Get updated user detail for response
    const userDetail = await getUserDetailByIdWithCache(userId);

    return NextResponse.json({
      userDetail: userDetail,
      message: 'User cache cleared successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}