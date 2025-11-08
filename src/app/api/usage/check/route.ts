import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getApiKeyUsageByApiKeyWithCache } from '@/lib/services/api_key_service';
import { getApiKeyByKey } from '@/db/queries/api-keys';
import { currentMonth } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const trimmedApiKey = apiKey.trim();

    // Validate API key using service layer
    const isValid = await validateApiKey(trimmedApiKey);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 404 }
      );
    }

    // Get API key basic information
    const keyData = await getApiKeyByKey(trimmedApiKey);
    if (!keyData) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Get usage information using service layer (with cache)
    const usageData = await getApiKeyUsageByApiKeyWithCache(trimmedApiKey);

    // Get current month usage from usage data or fallback to 0
    const currentMonthUsage = parseFloat(usageData?.quotaUsed!) || 0;

    // Calculate remaining quota
    const quota = keyData.quota ? parseInt(keyData.quota) : null;
    const remainingQuota = quota
      ? Math.max(0, quota - currentMonthUsage)
      : null;

    return NextResponse.json({
      id: keyData.id,
      name: keyData.name,
      key: keyData.key,
      createdAt: keyData.createdAt ? keyData.createdAt.toISOString() : null,
      lastUsedAt: keyData.lastUsedAt ? keyData.lastUsedAt.toISOString() : null,
      quota: quota,
      tokensUsed: currentMonthUsage,
      remainingQuota,
      expiredAt: keyData.expiredAt ? keyData.expiredAt.toISOString() : null,
      month: usageData?.month || `${currentMonth()}-1`,
      userId: usageData?.userId || null
    });

  } catch (error) {
    console.error('Error checking API key usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}