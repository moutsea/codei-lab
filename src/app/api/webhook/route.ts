import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { UserDetail } from '@/types';

import { createSubscription, getUserSubscriptionByStripeSubscriptionId, getUserSubscriptionByUserId, updateSubscriptionByStripeId, updateSubscriptionByUserId } from '@/lib/services/subscription_service';
import { createPaymentFromStripeIntent } from '@/lib/services/payment_service';
import { createOrUpdateUserDetailCache, deleteUserDetailCache, getUserFromDBById, updateUserStripeCustomerIdService } from '@/lib/services/user_service';
import { getPlanFromDBById } from '@/lib/services/plan_service'
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Webhook签名验证
async function verifyWebhookSignature(
  request: NextRequest
): Promise<Stripe.Event | null> {
  try {
    const body = await request.text();
    // const signature = (await headers()).get("stripe-signature") as string;
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header');
      return null;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return null;
    }
    // 验证并返回 event 对象
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

async function createSubscriptionFromPlan(
  userId: string,
  planId: string,
  status: string,
  stripeCustomerId: string,
  currentEndAt: Date
) {

  const plan = await getPlanFromDBById(planId);
  if (!plan) {
    console.error("plan not found, planId: ", planId);
    return null;
  }
  const now = new Date();
  const existingSubscription = await getUserSubscriptionByUserId(userId);

  const isSubscriptionActive = existingSubscription &&
    existingSubscription.status === 'active' &&
    existingSubscription.currentPeriodEnd &&
    existingSubscription.currentPeriodEnd > now;


  if (!isSubscriptionActive) {
    // console.log("Creating new subscription period.");
    const startDate = now;
    // const endDate = add(startDate, { days: daysToAdd });

    const subscriptionData = {
      userId,
      planId,
      status: status === 'paid' ? 'active' : status,
      startDate: startDate,
      currentPeriodEnd: currentEndAt,
      cancelAtPeriodEnd: true,
      cancelAt: currentEndAt,
      renewsAt: currentEndAt,
      stripeSubscriptionId: null,
      stripeCustomerId: stripeCustomerId
    };
    return await createSubscription(subscriptionData);

  } else {
    // 场景: 延长现有订阅
    console.log("Extending existing subscription period.");

    const updateData = {
      currentPeriodEnd: currentEndAt,
      renewsAt: currentEndAt,
      planId: planId,
    };

    return await updateSubscriptionByUserId(userId, updateData);
  }
}

// 创建订阅记录
async function createSubscriptionRecord(
  userId: string,
  planId: string,
  stripeSubscription: Stripe.Subscription
) {
  const subscription = stripeSubscription;

  const subscriptionData = {
    userId,
    planId,
    status: subscription.status,
    startDate: new Date(subscription.created * 1000),
    currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    cancelAt: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000)
      : null,
    renewsAt: new Date(subscription.items.data[0].current_period_end * 1000),
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
  };

  // 使用 subscription_service 创建订阅并缓存
  return await createSubscription(subscriptionData);
}


async function createPayment(
  userId: string,
  subscriptionId: string | null,
  paymentIntentId: string,
  amountTotal: number,
  currency: string | null,
  paymentStatus: string | null
) {
  const paymentData = {
    userId,
    subscriptionId: subscriptionId, // one-payment use planId as subscription id
    stripePaymentIntentId: paymentIntentId,
    amount: (amountTotal / 100).toString(), // 转换为元并转为字符串
    currency: currency?.toUpperCase() || 'USD',
    status: paymentStatus || 'unknown',
  };

  try {
    const newPayment = await createPaymentFromStripeIntent(paymentData);

    if (newPayment) {
      console.log(`✅ Created payment record: ${newPayment.id} for Stripe intent: ${paymentIntentId}`);
      return newPayment;
    } else {
      console.error('Failed to create payment record');
      return null;
    }
  } catch (error) {
    console.error('Error creating payment record:', error);
    return null;
  }
}

async function createPaymentRecord(
  userId: string,
  stripeSubscription: Stripe.Subscription
) {
  const subscription = stripeSubscription;
  if (!subscription.latest_invoice) {
    console.error('No latest_invoice found in subscription');
    return null;
  }
  const latestInvoiceId = typeof subscription.latest_invoice === 'string'
    ? subscription.latest_invoice
    : subscription.latest_invoice.id;
  const invoice = await stripe.invoices.retrieve(latestInvoiceId, {
    expand: ['payments.data.payment.payment_intent']
    // expand: ['payment_intent']
  });

  if (invoice.payments && invoice.payments.data.length > 0) {
    const inpay = invoice.payments.data[0]; // invoice_payment

    // 仅当 type 为 payment_intent 时才有 PaymentIntent
    if (inpay.payment?.type === 'payment_intent') {
      const pi = inpay.payment.payment_intent; // string | { id: string }（expandable）
      let paymentIntentId: string | undefined;

      if (typeof pi === 'string') {
        paymentIntentId = pi;
      } else if (pi && typeof pi === 'object' && 'id' in pi) {
        paymentIntentId = (pi as { id: string }).id;
      }

      if (!paymentIntentId) {
        console.error('Missing payment_intent on invoice payment');
        return null;
      }

      // 使用 payment_service 创建支付记录
      const paymentData = {
        userId,
        subscriptionId: subscription.id,
        stripePaymentIntentId: paymentIntentId,
        amount: ((invoice.amount_paid ?? 0) / 100).toString(), // 分→元
        currency: invoice.currency?.toUpperCase() || 'USD',
        status: invoice.status || 'unknown',
      };

      try {
        const newPayment = await createPaymentFromStripeIntent(paymentData);
        if (newPayment) {
          // console.log(`✅ Created payment record: ${newPayment.id} for Stripe intent: ${paymentIntentId}`);
          return newPayment;
        } else {
          console.error('Failed to create payment record');
          return null;
        }
      } catch (error) {
        console.error('Error creating payment record:', error);
        return null;
      }
    } else {
      // 可能是 charge（当 type 为 'charge' 时可以用 payment.charge）
      console.error(`Invoice payment type is not payment_intent: ${inpay.payment?.type}`);
      return null;
    }
  }
  console.warn('No payments found in invoice');
  return null;
}

async function updateUserCustomerId(
  userId: string,
  customerId: string
) {
  const user = await getUserFromDBById(userId);

  if (user && customerId && !user.stripeCustomerId) {
    // 使用 user_service 更新用户的 Stripe 客户 ID
    const updatedUser = await updateUserStripeCustomerIdService(user.id, customerId);

    if (updatedUser) {
      console.log(`Updated user ${userId} with Stripe customer ID: ${customerId}`);
    } else {
      console.error(`Failed to update user ${userId} with Stripe customer ID`);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证webhook签名
    const event = await verifyWebhookSignature(request);
    if (!event) {
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 401 }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'payment') {
          const userId = session.metadata?.userId;
          const stripeCustomerId = session.metadata?.stripeCustomerId;
          const planId = session.metadata?.planId;
          const currentEndAt = session.metadata?.currentEndAt;

          if (!userId || !stripeCustomerId || !planId || !currentEndAt) {
            console.error(`Parameters invalid ${userId}, stripeCustomerId: ${stripeCustomerId} planId: ${planId}`);
            return NextResponse.json(
              { error: 'Parameters invalid' },
              { status: 404 }
            );
          }

          await Promise.all([
            updateUserCustomerId(userId, stripeCustomerId),
            createPayment(userId, planId, session.payment_intent as string, session.amount_total!, session.currency, session.payment_status),
            createSubscriptionFromPlan(userId, planId, session.payment_status, stripeCustomerId, new Date(currentEndAt))
          ]);
        } else if (session.mode === 'subscription') {
          const userId = session.metadata?.userId;
          const auth0Id = session.metadata?.auth0Id;
          const quota = session.metadata?.quota;
          const stripeCustomerId = session.metadata?.stripeCustomerId;

          if (!userId || !auth0Id || !stripeCustomerId || !quota) {
            console.error(`User not found for userId: ${userId}, auth0Id: ${auth0Id}`);
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }

          await updateUserCustomerId(userId, stripeCustomerId)

          const userdetail: UserDetail = {
            userId: userId,
            name: null,
            email: null,
            stripeCustomerId,
            quota,
            quotaMonthlyUsed: '0'
          }

          await createOrUpdateUserDetailCache(userId, userdetail);
        } else {
          console.log("Unknow session mode");
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = subscription.metadata?.userId;
        const auth0Id = subscription.metadata?.auth0Id;
        const planId = subscription.metadata?.planId;
        const membershipLevel = subscription.metadata?.membershipLevel;
        const quota = subscription.metadata?.quota;
        const stripeCustomerId = subscription.metadata?.stripeCustomerId;

        if (!userId || !planId || !auth0Id || !quota || !stripeCustomerId) {
          console.error('Missing metadata in subscription:', subscription.id);
          return new Response('Missing metadata', { status: 400 });
        }

        await createSubscriptionRecord(userId, planId, subscription);
        await createPaymentRecord(userId, subscription);

        const userdetail: UserDetail = {
          userId: userId,
          name: null,
          email: null,
          stripeSubscriptionId: subscription.id,
          planId: planId,
          quota,
          stripeCustomerId,
          membershipLevel,
          quotaMonthlyUsed: '0'
        }

        await createOrUpdateUserDetailCache(userId, userdetail);

        console.log(`Subscription created for user ${auth0Id}, planId ${planId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = subscription.metadata?.userId;
        const stripeCustomerId = subscription.customer as string;
        const planId = subscription.items.data[0]?.price?.id || null;
        const plan = planId ? await getPlanFromDBById(planId) : null;
        const membershipLevel = plan?.membershipLevel || null;
        const quota = plan?.quota || null;

        if (!userId || !plan || !membershipLevel || !stripeCustomerId || !quota) {
          console.error('Missing metadata in subscription:', subscription.id);
          return new Response('Missing metadata', { status: 400 });
        }

        // 查找现有订阅记录
        const existingSubscription = getUserSubscriptionByStripeSubscriptionId(subscription.id)

        if (!existingSubscription) {
          console.error(`Subscription not found: ${subscription.id}`);
          return NextResponse.json(
            { error: 'Subscription not found' },
            { status: 404 }
          );
        }

        // 更新订阅信息
        const updates = {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          planId: subscription.items.data[0].plan.id,
          cancelAt: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000)
            : null,
          renewsAt: new Date(subscription.items.data[0].current_period_end * 1000),
        };

        await updateSubscriptionByStripeId(subscription.id, updates);
        await createPaymentRecord(userId, subscription);

        const userdetail: UserDetail = {
          userId: userId,
          name: null,
          email: null,
          stripeSubscriptionId: subscription.id,
          planId: planId!,
          quota,
          stripeCustomerId,
          membershipLevel,
        }

        await createOrUpdateUserDetailCache(userId, userdetail);

        console.log(`Subscription updated: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log('metadata: ', subscription.metadata);
        const userId = subscription.metadata?.userId;

        await updateSubscriptionByStripeId(subscription.id, {
          status: 'canceled',
          currentPeriodEnd: new Date(subscription.ended_at! * 1000),
          cancelAtPeriodEnd: true,
        });

        await deleteUserDetailCache(userId);

        console.log(`Subscription deleted: ${subscription.id}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 健康检查端点
export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'Stripe webhook API is running',
      config: {
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Configuration error',
      },
      { status: 500 }
    );
  }
}