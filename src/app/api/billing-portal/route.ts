import { NextRequest, NextResponse } from 'next/server';
import { generateBillingLink } from '@/lib/stripe';
import { getStripeCustomerIdByAuth0Id } from '@/lib/services/user_service'

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

      stripeCustomerId = await getStripeCustomerIdByAuth0Id(auth0UserId);

      if (!stripeCustomerId) {
        return NextResponse.json(
          { error: 'Missing stripeCustomerId' },
          { status: 400 }
        );
      }
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