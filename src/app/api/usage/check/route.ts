import { NextRequest, NextResponse } from 'next/server';
import { isApiKeyValid } from '@/db/queries/api-keys';
import { currentMonth } from '@/lib/utils';
import { db } from '@/db';
import { apiKeys, monthlyApiUsage } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

    // Validate API key
    const isValid = await isApiKeyValid(apiKey.trim());
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 404 }
      );
    }

    const apiLastUsage = db()
      .select({
        apiKey: monthlyApiUsage.apikey,
        month: monthlyApiUsage.month,
        totalTokens: monthlyApiUsage.totalTokens,
      })
      .from(monthlyApiUsage)
      .where(eq(monthlyApiUsage.apikey, apiKey))
      .orderBy(desc(monthlyApiUsage.month))
      .limit(1)
      .as("apiLastUsage");


    // Get API key information with current month usage
    const month = currentMonth();
    const [keyData] = await db()
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        key: apiKeys.key,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
        requestLimit: apiKeys.requestLimit,
        expiredAt: apiKeys.expiredAt,
        currentMonthUsage: apiLastUsage.totalTokens
      })
      .from(apiKeys)
      .leftJoin(apiLastUsage,
        eq(apiKeys.key, apiLastUsage.apiKey)
      )
      .where(eq(apiKeys.key, apiKey.trim()))
      .limit(1);

    if (!keyData) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Calculate remaining quota
    const remainingQuota = keyData.requestLimit
      ? Math.max(0, keyData.requestLimit - (keyData.currentMonthUsage || 0))
      : null;

    return NextResponse.json({
      id: keyData.id,
      name: keyData.name,
      key: keyData.key,
      createdAt: keyData.createdAt ? keyData.createdAt.toISOString() : null,
      lastUsedAt: keyData.lastUsedAt ? keyData.lastUsedAt.toISOString() : null,
      requestLimit: keyData.requestLimit,
      tokensUsed: keyData.currentMonthUsage || 0,
      remainingQuota,
      expiredAt: keyData.expiredAt ? keyData.expiredAt.toISOString() : null,
      month: month
    });

  } catch (error) {
    console.error('Error checking API key usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}