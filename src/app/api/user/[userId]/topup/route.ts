import { NextRequest, NextResponse } from 'next/server';
import { getUserTopUpRecord } from '@/lib/services/user_service';

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

    // Get user's top-up record
    const topUpRecord = await getUserTopUpRecord(userId);

    // console.log(topUpRecord);
    return NextResponse.json({
      success: true,
      data: topUpRecord
    });

  } catch (error) {
    console.error('Error fetching user top-up record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top-up record' },
      { status: 500 }
    );
  }
}