import { NextRequest, NextResponse } from 'next/server';
import { generateBillingLink } from '@/lib/stripe';
import { getStripeCustomerIdByAuth0Id, getUserDetailByAuth0IdWithCache } from '@/lib/services/user_service'

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    let { stripeCustomerId } = requestData;
    const { auth0UserId } = requestData;

    if (!stripeCustomerId) {
      if (!auth0UserId) {
        return NextResponse.json(
          { error: 'Missing stripeCustomerId' },
          { status: 400 }
        );
      }

      const [fetchedStripeCustomerId, fetchedUserDetail] = await Promise.all([
        getStripeCustomerIdByAuth0Id(auth0UserId),
        getUserDetailByAuth0IdWithCache(auth0UserId),
      ]);

      if (!fetchedStripeCustomerId || !fetchedUserDetail) {
        return NextResponse.json({ error: "Missing stripeCustomerId" }, { status: 400 });
      }

      if (!fetchedUserDetail.active) {
        return NextResponse.json({ billingUrl: "/#pricing" });
      }

      stripeCustomerId = fetchedStripeCustomerId;
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