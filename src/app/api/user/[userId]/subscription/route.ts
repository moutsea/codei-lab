import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscriptionByUserId } from '@/lib/services/subscription_service';

export async function GET(
    _request: NextRequest,
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

        const subscription = await getUserSubscriptionByUserId(userId);

        if (!subscription) {
            return NextResponse.json({
                subscription: null,
                userId,
                message: 'No active subscription found'
            });
        }

        return NextResponse.json({
            subscription,
            userId
        });
    } catch (error) {
        console.error('Error fetching user subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
