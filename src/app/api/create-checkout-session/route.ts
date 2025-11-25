import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateUserStripeCustomerIdService, getUserDetailByIdWithCache } from '@/lib/services/user_service'
import { getPlanFromDBById } from '@/lib/services/plan_service'

import { PlanSelect, UserDetail } from '@/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

type PriceDiff = {
  totalAmount: number | null,
  newEndAt: Date | null
};

function planToLevel(level: string): number {
  const key = String(level).trim().toLowerCase();
  const map: Record<string, number> = {
    pro: 3,
    plus: 2,
    trial: 1,
  };
  return map[key] ?? 0;
}

function intervalToDays(interval: string): number {
  const key = String(interval).trim().toLowerCase();
  const map: Record<string, number> = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
  };
  return map[key] ?? 30; // Default to 30 days if interval not recognized
}

async function getPriceDiff(
  userDetail: UserDetail,
  oldPlan: PlanSelect,
  newPlan: PlanSelect
): Promise<PriceDiff> {
  const now = new Date();
  const currentEndAt = new Date(userDetail.currentEndAt!);
  const oldPlanInterval = oldPlan ? intervalToDays(oldPlan.interval) : 30;

  // 计算剩余天数
  const timeDiff = currentEndAt.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const newPlanIntervalDays = intervalToDays(newPlan.interval);

  // 计算差价
  const totalAmount = oldPlan
    ? ((newPlan.amount / newPlanIntervalDays) - (oldPlan.amount / oldPlanInterval)) * daysDiff
    : (newPlan.amount / newPlanIntervalDays) * daysDiff;

  return {
    totalAmount: Math.round(totalAmount),
    newEndAt: currentEndAt
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, priceId, interval, userId, quota, currency, type, currentEndAt } = body;

    if (!planId || !priceId || !interval || !userId || !quota || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, priceId, interval, userId' },
        { status: 400 }
      );
    }

    // 验证必要的环境变量
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_APP_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Missing base URL' },
        { status: 500 }
      );
    }

    const [userDetail, plan] = await Promise.all([
      getUserDetailByIdWithCache(userId),
      getPlanFromDBById(planId)
    ]);

    if (!userDetail) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found, planId: ', planId },
        { status: 404 }
      );
    }

    if (userDetail.currency !== "" && userDetail?.currency !== currency) {
      return NextResponse.json(
        {
          error: 'CURRENCY_CONFLICT',
          type: 'currency_conflict'
        },
        { status: 400 }
      );
    }

    let customerId = userDetail.stripeCustomerId;
    if (customerId) {
      customerId = userDetail.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: userDetail.email!,
        name: userDetail.name!,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;

      await updateUserStripeCustomerIdService(userId, customerId);
      console.log(`✅ Created new Stripe customer: ${customerId}`);
    }

    const endDate = currentEndAt ? new Date(currentEndAt) : new Date();
    endDate.setDate(endDate.getDate() + intervalToDays(plan.interval));

    const metadata = {
      planId: planId,
      interval: interval,
      userId,
      stripeCustomerId: customerId,
      currentEndAt: endDate.toISOString(),
      quota,
      type: plan.type,
      currency: plan.currency,
      previousMember: userDetail.membershipLevel || "",
      previousQuota: parseFloat(userDetail.quota),
      currentMember: plan.membershipLevel
    };

    let sessionId, url;

    // console.log("middle")
    if (type === 'extra' || type === 'renew') {
      let name: string = "";

      if (type === 'extra') {
        name = currency === 'USD'
          ? `Top up for ${plan.name}\n Expiry date: ${endDate.toLocaleDateString().slice(0, 10)}`
          : `${plan.name}加油包\n 到期时间：${endDate.toLocaleDateString().slice(0, 10)}`;
      } else {
        name = `${plan.name}\n 到期时间：${endDate.toLocaleDateString().slice(0, 10)}`
      }
      // extra package
      const session = await stripe.checkout.sessions.create({
        customer: customerId!,
        client_reference_id: userId,
        payment_method_types: currency == 'USD' ? ['link', 'card'] : ['wechat_pay'],
        line_items: [{
          price_data: {
            currency: currency,
            product_data: {
              name
            },
            unit_amount: plan.amount!
          },
          quantity: 1
        }],
        mode: 'payment',
        payment_method_options: {
          wechat_pay: {
            client: 'web',
          },
        },
        success_url: `${baseUrl}/dashboard`,
        cancel_url: `${baseUrl}#pricing`,
        metadata: metadata,
        ...(plan.isRecurring && {
          subscription_data: {
            metadata: metadata
          }
        })
      });
      sessionId = session.id;
      url = session.url;

      return NextResponse.json({
        sessionId, url
      });
    }

    if (!userDetail.active) {
      metadata.previousMember = "";
      const session = await stripe.checkout.sessions.create({
        customer: customerId!,
        client_reference_id: userId,
        payment_method_types: currency == 'USD' ? ['link', 'card'] : ['wechat_pay'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        phone_number_collection: { enabled: true },
        mode: plan.isRecurring ? 'subscription' : 'payment',
        payment_method_options: {
          wechat_pay: {
            client: 'web',
          },
        },
        success_url: `${baseUrl}/dashboard`,
        cancel_url: `${baseUrl}#pricing`,
        metadata: metadata,
        ...(plan.isRecurring && {
          subscription_data: {
            metadata: metadata
          }
        })
      });

      sessionId = session.id;
      url = session.url;

      return NextResponse.json({
        sessionId, url
      });
    }

    const oldPlan = await getPlanFromDBById(userDetail.planId!);
    const oldPlanLevel = planToLevel(oldPlan!.membershipLevel!);
    const newPlanLevel = planToLevel(plan.membershipLevel!);

    if (oldPlanLevel > newPlanLevel) {
      return NextResponse.json(
        {
          error: 'PLAN_DOWNGRADE_ERROR',
          type: 'plan_downgrade_error',
          currentPlan: oldPlan?.membershipLevel
        },
        { status: 400 }
      );
    }

    let priceDiff: PriceDiff = { totalAmount: plan.amount, newEndAt: userDetail.currentEndAt! };

    const now = new Date();

    // if subscribe the same plan, just enlarge the enddate
    if (oldPlanLevel === newPlanLevel) {
      const newEndAt = new Date(now);
      newEndAt.setDate(new Date(userDetail.currentEndAt!).getDate() + intervalToDays(plan.interval));

      priceDiff = {
        totalAmount: plan.amount,
        newEndAt
      };

      metadata.currentEndAt = newEndAt.toISOString();

      const session = await stripe.checkout.sessions.create({
        customer: customerId!,
        client_reference_id: userId,
        payment_method_types: currency == 'USD' ? ['link', 'card'] : ['wechat_pay'],
        line_items: [{
          price_data: {
            currency: currency,
            product_data: {
              name: (currency === 'usd' || currency == 'USD')
                ? `Upgrade ${plan.name} membership fee difference\n Membership expiry: ${priceDiff.newEndAt!.toISOString().slice(0, 10)}`
                : `升级${plan.name}会员费用差价\n 会员到期时间：${priceDiff.newEndAt!.toISOString().slice(0, 10)}`
            },
            unit_amount: priceDiff.totalAmount!
          },
          quantity: 1
        }],
        mode: 'payment',
        payment_method_options: {
          wechat_pay: {
            client: 'web',
          },
        },
        success_url: `${baseUrl}/dashboard`,
        cancel_url: `${baseUrl}#pricing`,
        metadata: metadata,
        ...(plan.isRecurring && {
          subscription_data: {
            metadata: metadata
          }
        })
      });
      sessionId = session.id;
      url = session.url;

      return NextResponse.json({
        sessionId, url
      });
    }

    if (oldPlan?.membershipLevel === 'trial') {
      const session = await stripe.checkout.sessions.create({
        customer: customerId!,
        client_reference_id: userId,
        payment_method_types: currency == 'USD' ? ['link', 'card'] : ['wechat_pay'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        phone_number_collection: { enabled: true },
        mode: plan.isRecurring ? 'subscription' : 'payment',
        payment_method_options: {
          wechat_pay: {
            client: 'web',
          },
        },
        success_url: `${baseUrl}/dashboard`,
        cancel_url: `${baseUrl}#pricing`,
        metadata: metadata,
        ...(plan.isRecurring && {
          subscription_data: {
            metadata: metadata
          }
        })
      });

      sessionId = session.id;
      url = session.url;

      return NextResponse.json({
        sessionId, url
      });
    }

    priceDiff = await getPriceDiff(userDetail, oldPlan!, plan);
    metadata.currentEndAt = priceDiff.newEndAt!.toISOString();

    const session = await stripe.checkout.sessions.create({
      customer: customerId!,
      client_reference_id: userId,
      payment_method_types: currency == 'USD' ? ['link', 'card'] : ['wechat_pay'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: currency === 'USD'
              ? `Upgrade ${plan.name} membership fee difference\n Membership expiry: ${priceDiff.newEndAt!.toISOString().slice(0, 10)}`
              : `升级${plan.name}会员费用差价\n 会员到期时间：${priceDiff.newEndAt!.toISOString().slice(0, 10)}`
          },
          unit_amount: priceDiff.totalAmount!
        },
        quantity: 1
      }],
      mode: 'payment',
      payment_method_options: {
        wechat_pay: {
          client: 'web',
        },
      },
      success_url: `${baseUrl}/dashboard`,
      cancel_url: `${baseUrl}#pricing`,
      metadata: metadata,
      ...(plan.isRecurring && {
        subscription_data: {
          metadata: metadata
        }
      })
    });
    sessionId = session.id;
    url = session.url;

    return NextResponse.json({
      sessionId, url
    });

  } catch (error) {
    // Handle other Stripe specific errors
    if (error instanceof Error && error.message.includes('stripe')) {
      return NextResponse.json(
        {
          error: 'STRIPE_ERROR',
          type: 'stripe_error'
        },
        { status: 400 }
      );
    }

    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        type: 'server_error'
      },
      { status: 500 }
    );
  }
}