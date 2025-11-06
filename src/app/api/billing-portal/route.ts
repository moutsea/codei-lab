import { NextRequest, NextResponse } from 'next/server';
import { generateBillingLink } from '@/lib/stripe';
import { getUserFromDBById, getUserDetailByIdWithCache } from '@/lib/services/user_service'

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    let { stripeCustomerId } = requestData;
    const { userId } = requestData;

    if (!stripeCustomerId) {
      if (!userId) {
        return NextResponse.json(
          { error: 'Missing userId or stripeCustomerId' },
          { status: 400 }
        );
      }

      const [user, fetchedUserDetail] = await Promise.all([
        getUserFromDBById(userId),
        getUserDetailByIdWithCache(userId),
      ]);

      if (!user || !fetchedUserDetail) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!user.stripeCustomerId) {
        return NextResponse.json({ error: "Missing stripeCustomerId" }, { status: 400 });
      }

      if (!fetchedUserDetail.active) {
        return NextResponse.json({ billingUrl: "/#pricing" });
      }

      stripeCustomerId = user.stripeCustomerId;
    }
    const billingUrl = await generateBillingLink(stripeCustomerId);

    if (!billingUrl) {
      return NextResponse.json(
        { error: 'Failed to generate billing link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ billingUrl });
  } catch (error) {
    console.error('Error generating billing link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}