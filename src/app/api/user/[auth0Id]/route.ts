import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromDBByAuth0,
  createUserFromDBByAuth0,
  getUserDetailByAuth0IdWithCache,
  createOrUpdateUserByAuth0Id,
  deleteUserDetailCacheByAuth0Id
} from '@/lib/services/user_service';

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

    const userDetail = await getUserDetailByAuth0IdWithCache(auth0Id);

    if (!userDetail) {
      // New user - this is normal, return default user structure
      let user = await getUserFromDBByAuth0(auth0Id);

      if (!user) {
        console.log(`User not found for Auth0 ID: ${auth0Id}`);
        return NextResponse.json({ user: null, isNewUser: true });
      }

      const defaultUserDetail = {
        userId: user.id,
        auth0UserId: user.auth0UserId,
        stripeSubscriptionId: null,
        planId: null,
        stripeCustomerId: user.stripeCustomerId || null,
        membershipLevel: null,
        active: false,
        cancelAt: null,
        requestLimit: 0,
        tokenMonthlyUsed: 0,
      };

      return NextResponse.json({ user: defaultUserDetail, isNewUser: true });
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
  { params }: { params: Promise<{ auth0Id: string }> }
) {
  try {
    const { auth0Id } = await params;
    const body = await request.json();
    const { email, nickname, name, avatarUrl } = body;

    if (!auth0Id) {
      return NextResponse.json(
        { error: 'Auth0 ID is required' },
        { status: 400 }
      );
    }

    // Create or update user using the service method
    // If name is provided, use it as nickname, otherwise use provided nickname
    const finalNickname = name?.trim() || nickname?.trim() || undefined;

    const result = await createOrUpdateUserByAuth0Id({
      auth0UserId: auth0Id,
      email: email.trim(),
      nickname: finalNickname,
      avatarUrl: avatarUrl?.trim() || undefined,
    });

    if (!result.user) {
      return NextResponse.json(
        { error: 'Failed to create or update user' },
        { status: 500 }
      );
    }

    // Clear user detail cache to ensure fresh data on next request
    if (result) {
      await deleteUserDetailCacheByAuth0Id(auth0Id);
      console.log(`✅ Cleared user detail cache for userId: ${result.user.id}`);
    }

    // Get user detail for response (this will fetch fresh data)
    const userDetail = await getUserDetailByAuth0IdWithCache(auth0Id);

    return NextResponse.json({
      user: result.user,
      userDetail: userDetail,
      isNewUser: result.isNewUser,
      message: result.isNewUser ? 'User created successfully' : 'User updated successfully'
    });

  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

