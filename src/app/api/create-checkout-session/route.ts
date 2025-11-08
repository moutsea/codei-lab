import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromDBById, updateUserStripeCustomerIdService, getUserDetailByIdWithCache } from '@/lib/services/user_service'
import { getPlanFromDBById } from '@/lib/services/plan_service'

import { PlanSelect, UserDetail } from '@/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

function planToLevel(level: string): number {
  const key = String(level).trim().toLowerCase();
  const map: Record<string, number> = {
    team: 3,
    pro: 2,
    lite: 1,
  };
  return map[key] ?? 0;
}

async function getPriceDiff(
  userDetail: UserDetail,
  newPlan: PlanSelect
) {
  const now = new Date();
  if (!userDetail || userDetail.currentEndAt! < now) {
    // 当前订阅已过期，直接返回新方案金额和新到期时间
    const newEndAt = new Date(now);
    newEndAt.setDate(now.getDate() + (newPlan.interval === 'quarter' ? 90 : 30));

    return {
      totalAmount: newPlan.amount,
      newEndAt
    };
  }

  const currentEndAt = new Date(userDetail.currentEndAt!);

  if (userDetail.membershipLevel === newPlan.membershipLevel) {
    const newEndAt = new Date(currentEndAt);
    newEndAt.setDate(currentEndAt.getDate() + (newPlan.interval === 'quarter' ? 90 : 30));
    return {
      totalAmount: newPlan.amount,
      newEndAt
    }
  }

  const oldPlan = await getPlanFromDBById(userDetail.planId!);

  if (oldPlan && planToLevel(oldPlan.membershipLevel) > planToLevel(newPlan.membershipLevel)) {
    return null;
  }

  const oldPlanInterval = oldPlan?.interval === 'quarter' ? 90 : 30;

  // 计算剩余天数
  const timeDiff = currentEndAt.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const newPlanIntervalDays = newPlan.interval === 'quarter' ? 90 : 30;

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
    const { planId, priceId, interval, userId, requestLimit } = body;

    if (!planId || !priceId || !interval || !userId || !requestLimit) {
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

    const [user, userDetail, plan] = await Promise.all([
      getUserFromDBById(userId),
      getUserDetailByIdWithCache(userId),
      getPlanFromDBById(planId)
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let customerId = user.stripeCustomerId;
    if (customerId) {
      customerId = user.stripeCustomerId;
      console.log(`✅ Found customerId in user data: ${customerId}`);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.nickname || user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      await updateUserStripeCustomerIdService(user.id, customerId);
      console.log(`✅ Created new Stripe customer: ${customerId}`);
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found, planId: ', planId },
        { status: 404 }
      );
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (plan.interval === 'quarter' ? 90 : 30));

    const metadata = {
      planId: planId,
      interval: interval,
      userId: user.id,
      stripeCustomerId: customerId,
      currentEndAt: endDate.toISOString(),
      requestLimit
    };

    let sessionId, url;

    if (userDetail?.active && !userDetail.stripeSubscriptionId) {
      const priceDiff = await getPriceDiff(userDetail, plan);

      if (!priceDiff) {
        return NextResponse.json(
          {
            error: 'SUBSCRIPTION_CONFLICT',
            message: '您已有 Pro 及以上的订阅或订单，暂不支持降级订阅',
            details: "You're already subscribed in Pro/Team membership, currently we don't support downgrade",
            type: 'subscription_conflict'
          },
          { status: 400 }
        );
      }

      metadata.currentEndAt = priceDiff.newEndAt.toISOString();

      const session = await stripe.checkout.sessions.create({
        customer: customerId!,
        client_reference_id: user.id,
        payment_method_types: ['alipay', 'wechat_pay'],
        line_items: [{
          price_data: {
            currency: 'cny',
            product_data: { name: `升级${plan.name}会员费用差价\n 会员到期时间：${priceDiff.newEndAt.toISOString().slice(0, 10)}` },
            unit_amount: priceDiff.totalAmount
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

    } else {
      // 创建checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId!,
        client_reference_id: user.id, // 设置client_reference_id为用户ID
        payment_method_types: plan.isRecurring ? ['link', 'card'] : ['alipay', 'wechat_pay'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        phone_number_collection: { enabled: true }, // 可选
        // customer_email: user.email, // 可选
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
    }

    return NextResponse.json({
      sessionId, url
    });

  } catch (error) {
    // Handle specific Stripe currency conflict error
    if (error instanceof Error && error.message.includes('cannot combine currencies')) {
      return NextResponse.json(
        {
          error: 'CURRENCY_CONFLICT',
          message: '您无法在不同货币之间进行购买。由于您已有使用美元(USD)的订阅或订单，请选择相同货币的套餐，或联系客服处理。',
          details: 'You cannot combine currencies for a single customer. This customer has active subscriptions or orders in USD.',
          type: 'currency_conflict'
        },
        { status: 400 }
      );
    }

    // Handle other Stripe specific errors
    if (error instanceof Error && error.message.includes('stripe')) {
      return NextResponse.json(
        {
          error: 'STRIPE_ERROR',
          message: '支付处理失败，请稍后重试或联系客服。',
          details: error.message,
          type: 'payment_error'
        },
        { status: 400 }
      );
    }
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误，请稍后重试。',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'server_error'
      },
      { status: 500 }
    );
  }
}