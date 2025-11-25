import { NextRequest, NextResponse } from 'next/server';
import { getUserFromDBById, getUserDetailByIdWithCache } from '@/lib/services/user_service'
import { deleteApiKey, generateApiKey, getUserApiKeys, updateApiKey } from '@/lib/services/api_key_service'
import { currentMonth, currentSubscription } from '@/lib/utils'

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

    const userData = await getUserDetailByIdWithCache(userId);
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const subscriptionCycle = currentSubscription(new Date(userData.startDate!));
    const apiKeys = await getUserApiKeys(userId, subscriptionCycle);

    // console.log(apiKeys);
    const responseData = {
      apiKeys: apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        key: key.key,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        month: subscriptionCycle,
        quota: key.quota,
        tokensUsed: key.currentMonthUsage,
        remainingQuota: key.quota ? Math.max(0, parseFloat(key.quota) - (key.currentMonthUsage)) : null,
        expiredAt: key.expiredAt
      })),
      userId: userId
    };

    // console.log(responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { name, quota, expiredAt } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const user = await getUserFromDBById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 创建新的 API Key
    const newApiKey = await generateApiKey(userId, name.trim(), quota, expiredAt ? new Date(expiredAt) : null);

    if (!newApiKey) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const responseData = {
      id: newApiKey.id,
      name: name.trim(),
      key: newApiKey.key,
      createdAt: newApiKey.createdAt!.toISOString(),
      lastUsedAt: newApiKey.lastUsedAt ? newApiKey.lastUsedAt.toISOString() : null,
      quota: newApiKey.quota,
      tokensUsed: 0,
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('Error creating API key:', error);
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
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, quota, expiredAt } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    // 获取用户信息 - we still need to validate the user exists
    const user = await getUserFromDBById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 更新 API Key
    const updatedApiKey = await updateApiKey(parseInt(keyId), {
      name: name.trim(),
      quota,
      expiredAt: expiredAt ? new Date(expiredAt) : null,
    });

    if (!updatedApiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'API key updated successfully',
      apiKey: {
        id: updatedApiKey.id,
        name: updatedApiKey.name,
        key: updatedApiKey.key,
        quota: updatedApiKey.quota,
        expiredAt: updatedApiKey.expiredAt,
        createdAt: updatedApiKey.createdAt,
        lastUsedAt: updatedApiKey.lastUsedAt
      }
    });

  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    // 删除 API Key
    const deletedKey = await deleteApiKey(parseInt(keyId));

    if (!deletedKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}