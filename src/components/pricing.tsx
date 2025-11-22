'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Star, Zap, Users, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';
import { useUserData } from '@/hooks/useUserData';

interface Plan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: string;
  quota: string;
  type: string;
  membershipLevel: string;
  stripePriceId?: string;
  stripeProductId?: string;
}

interface SubscriptionCycle {
  interval: 'month' | 'quarter' | 'year' | 'week';
  price: number;
  stripePriceId: string;
}

export default function Pricing() {
  const t = useTranslations('pricingSection');
  const locale = useLocale();
  const { data: session } = useSession();
  const user = session?.user;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCycleDialog, setShowCycleDialog] = useState(false);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

  const {
    userDetail,
    isActive,
    loading: userDataLoading,
  } = useUserData();

  function planToLevel(level: string): number {
    const key = String(level).trim().toLowerCase();
    const map: Record<string, number> = {
      pro: 3,
      plus: 2,
      trial: 1,
    };
    return map[key] ?? 0;
  }

  // Fetch frontpage plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/plans?type=frontpage');

        if (!response.ok) {
          throw new Error(`Failed to fetch plans: ${response.status}`);
        }

        const data = await response.json();
        setPlans(data);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError(err instanceof Error ? err.message : 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Filter plans for each card type
  const trialPlan = plans.find(plan =>
    plan.membershipLevel === 'trial' &&
    plan.currency.toLowerCase() === 'usd'
  );

  const plusPlans = plans.filter(plan =>
    plan.type === 'sub' &&
    plan.membershipLevel === 'plus' &&
    plan.currency.toLowerCase() === 'usd'
  ).sort((a, b) => {
    // Sort by interval: month, quarter, year
    const order: Record<string, number> = { 'month': 1, 'quarter': 2, 'year': 3 };
    return (order[a.interval] || 999) - (order[b.interval] || 999);
  });

  const proPlans = plans.filter(plan =>
    plan.type === 'sub' &&
    plan.membershipLevel === 'pro' &&
    plan.currency.toLowerCase() === 'usd'
  ).sort((a, b) => {
    // Sort by interval: month, quarter, year
    const order: Record<string, number> = { 'month': 1, 'quarter': 2, 'year': 3 };
    return (order[a.interval] || 999) - (order[b.interval] || 999);
  });

  // Filter CNY payment plans
  const trialCnyPlan = plans.find(plan =>
    plan.type === 'pay' &&
    plan.membershipLevel === 'trial' &&
    plan.currency.toLowerCase() === 'cny'
  );

  const plusCnyPlan = plans.find(plan =>
    plan.type === 'pay' &&
    plan.membershipLevel === 'plus' &&
    plan.currency.toLowerCase() === 'cny'
  );

  const proCnyPlan = plans.find(plan =>
    plan.type === 'pay' &&
    plan.membershipLevel === 'pro' &&
    plan.currency.toLowerCase() === 'cny'
  );

  // Prepare subscription cycles for dialog
  const getSubscriptionCycles = (planGroup: Plan[]): SubscriptionCycle[] => {
    return planGroup.map(plan => ({
      interval: plan.interval as 'month' | 'quarter' | 'year' | 'week',
      price: plan.amount / 100, // Convert from cents to dollars
      stripePriceId: plan.stripePriceId || ''
    }));
  };

  const getIntervalLabel = (interval: string) => {
    switch (interval) {
      case 'week':
        return t('week') || 'week';
      case 'month':
        return t('month') || 'month';
      case 'quarter':
        return t('quarter') || 'quarter';
      case 'year':
        return t('year') || 'year';
      default:
        return interval;
    }
  };

  const handleSubscribe = async (plan: Plan, selectedCycle?: SubscriptionCycle) => {
    try {
      if (!user?.email) {
        const loginUrl = locale === 'en' ? '/login' : `/${locale}/login`;
        window.location.assign(loginUrl);
        return;
      }

      if (userDetail?.membershipLevel && planToLevel(plan.membershipLevel) < planToLevel(userDetail?.membershipLevel)) {
        const currentPlan = userDetail.membershipLevel;
        const requestedPlan = plan.membershipLevel;
        const errorMessage = t('planDowngradeError', {
          currentPlan,
          requestedPlan,
          defaultValue: `You currently have a ${currentPlan} subscription. Downgrading to ${requestedPlan} is not allowed. Please cancel your current subscription first and then subscribe to the new plan.`
        });
        alert(errorMessage);
        return;
      }

      setSubscribingPlanId(plan.id);

      const priceId = selectedCycle?.stripePriceId || plan.stripePriceId;

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: priceId,
          interval: selectedCycle?.interval || plan.interval,
          userId: user.id,
          quota: plan.quota,
          currency: plan.currency
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || t('subscriptionError', { defaultValue: 'Failed to create checkout session' });

        // Special handling for currency conflict
        if (errorData.error && errorData.error === 'CURRENCY_CONFLICT') {
          const existingCurrency = errorData.existingCurrency || 'CNY';
          const requestedCurrency = plan.currency.toUpperCase();
          errorMessage = t('currencyConflictError', {
            existingCurrency,
            requestedCurrency,
            defaultValue: `You already have a subscription with ${existingCurrency}. You cannot subscribe with ${requestedCurrency} at the same time.`
          });
        }

        // Special handling for plan downgrade error
        if (errorData.error && errorData.error === 'PLAN_DOWNGRADE_ERROR') {
          const currentPlan = errorData.currentPlan || 'Pro';
          const requestedPlan = plan.membershipLevel;
          errorMessage = t('planDowngradeError', {
            currentPlan,
            requestedPlan,
            defaultValue: `You currently have a ${currentPlan} subscription. Downgrading to ${requestedPlan} is not allowed. Please cancel your current subscription first and then subscribe to the new plan.`
          });
        }

        // Special handling for server error
        if (errorData.error && errorData.error === 'SERVER_ERROR') {
          errorMessage = t('serverError', {
            defaultValue: 'An unexpected server error occurred. Please try again later or contact support if the problem persists.'
          });
        }

        // Special handling for Stripe error
        if (errorData.error && errorData.error === 'STRIPE_ERROR') {
          const stripeErrorType = errorData.stripeErrorType || 'payment';
          errorMessage = t('stripeError', {
            errorType: stripeErrorType,
            defaultValue: `A payment processing error occurred (${stripeErrorType}). Please check your payment details and try again.`
          });
        }

        alert(errorMessage);
        return;
      }

      const { url } = await response.json();
      window.open(url);
    } catch (error) {
      console.error('Subscription error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process subscription. Please try again.');
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleOneTimePay = (plan: Plan) => {

    if (userDetail?.membershipLevel && planToLevel(plan.membershipLevel) < planToLevel(userDetail?.membershipLevel)) {
      const currentPlan = userDetail.membershipLevel;
      const requestedPlan = plan.membershipLevel;
      const errorMessage = t('planDowngradeError', {
        currentPlan,
        requestedPlan,
        defaultValue: `You currently have a ${currentPlan} subscription. Downgrading to ${requestedPlan} is not allowed. Please cancel your current subscription first and then subscribe to the new plan.`
      });
      alert(errorMessage);
      return;
    }

    if (isActive && userDetail?.membershipLevel === plan.membershipLevel && plan.membershipLevel === 'trial') {
      alert(t('duplicateError'));
      return;
    }

    if (isActive && userDetail?.currency !== plan.currency) {
      const existingCurrency = userDetail?.currency!;
      const requestedCurrency = plan.currency.toUpperCase();
      const errorMessage = t('currencyConflictError', {
        existingCurrency,
        requestedCurrency,
        defaultValue: `You already have a subscription with ${existingCurrency}. You cannot subscribe with ${requestedCurrency} at the same time.`
      });
      alert(errorMessage);
      return;
    }

    handleSubscribe(plan);
  };

  const handlePlusSubscribe = () => {
    if (isActive && userDetail?.membershipLevel !== 'trial') {
      handleBillingPortal();
      return;
    }

    if (isActive && userDetail?.membershipLevel === "trial" && userDetail.currency === "CNY") {
      const existingCurrency = userDetail.currency || 'CNY';
      const requestedCurrency = "USD";
      const errorMessage = t('currencyConflictError', {
        existingCurrency,
        requestedCurrency,
        defaultValue: `You already have a subscription with ${existingCurrency}. You cannot subscribe with ${requestedCurrency} at the same time.`
      });
      alert(errorMessage);
      return;
    }

    if (plusPlans.length > 0) {
      setSelectedPlan(plusPlans[0]); // Use the first plan as base
      setShowCycleDialog(true);
    }
  };

  const handleProSubscribe = () => {
    if (isActive && userDetail?.membershipLevel !== 'trial') {
      handleBillingPortal();
      return;
    }

    if (isActive && userDetail?.membershipLevel === "trial" && userDetail.currency === "CNY") {
      const existingCurrency = userDetail.currency || 'CNY';
      const requestedCurrency = "USD";
      const errorMessage = t('currencyConflictError', {
        existingCurrency,
        requestedCurrency,
        defaultValue: `You already have a subscription with ${existingCurrency}. You cannot subscribe with ${requestedCurrency} at the same time.`
      });
      alert(errorMessage);
      return;
    }

    if (proPlans.length > 0) {
      setSelectedPlan(proPlans[0]); // Use the first plan as base
      setShowCycleDialog(true);
    }
  };

  const handleCycleSelect = (cycle: SubscriptionCycle) => {
    if (selectedPlan) {
      setShowCycleDialog(false);
      // Create a temporary plan object with selected cycle data
      const planWithCycle = {
        ...selectedPlan,
        stripePriceId: cycle.stripePriceId,
        amount: cycle.price * 100, // Convert back to cents
        interval: cycle.interval
      };
      handleSubscribe(planWithCycle, cycle);
    }
  };

  const handleBillingPortal = async () => {
    try {
      const stripeCustomerId = userDetail?.stripeCustomerId;
      if (stripeCustomerId) {
        const response = await fetch('/api/billing-portal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stripeCustomerId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch billing URL, status: ${response.status}`);
        }

        const data = await response.json();

        if (data.billingUrl) {
          window.open(data.billingUrl);
        } else {
          console.error('Failed to get billing URL:', data.error);
        }
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      alert(error instanceof Error ? error.message : 'Failed to open billing portal. Please try again.');
    }
  };

  if (loading || userDataLoading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 section-themed">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-8">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-8 mx-auto" />
                  <Skeleton className="h-8 w-32 mx-auto" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-12 w-24 mx-auto" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 section-themed">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Alert className="max-w-md mx-auto">
              <AlertDescription>
                {t('loadError', { error })}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              {t('retry')}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const SubscriptionCycleDialog = ({
    planName,
    cycles
  }: {
    planName: string;
    cycles: SubscriptionCycle[]
  }) => {
    const dialogT = useTranslations('pricingSection.subscriptionDialog');

    return (
      <Dialog open={showCycleDialog} onOpenChange={setShowCycleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogT('title')}</DialogTitle>
            <DialogDescription>
              {dialogT('description', { planName })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {cycles.map((cycle, index) => {
              const getDiscountBadge = (interval: string) => {
                switch (interval) {
                  case 'quarter':
                    return (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-2">
                        15% off
                      </span>
                    );
                  case 'year':
                    return (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-2">
                        25% off
                      </span>
                    );
                  default:
                    return null;
                }
              };

              return (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleCycleSelect(cycle)}
                  disabled={subscribingPlanId !== null}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="text-left">
                      <div className="flex items-center">
                        <div className="font-medium capitalize">{cycle.interval}</div>
                        {getDiscountBadge(cycle.interval)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {dialogT('billedEvery', { interval: getIntervalLabel(cycle.interval) })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${cycle.price.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {dialogT('perInterval', { interval: getIntervalLabel(cycle.interval) })}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCycleDialog(false)}>
              {dialogT('cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 section-themed">

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4 mr-2" />
            {t('allPlansInclude')}: {t('securePayment')}, {t('instantAccess')}, {t('cancelAnytime')}
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">
          {/* Trial Card */}
          {trialPlan && (
            <div className="relative group">
              <div className="bg-[#f8f8f8] dark:bg-card rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl mb-6">
                    <Zap className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Trial
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t('trialSubtitle')}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      ${(trialPlan.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('forOneWeek', { duration: getIntervalLabel(trialPlan.interval) })}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    {t('featuresList')}
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        <strong>{t('validityPeriod')}:</strong> {t('sevenDays')}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        <strong>{t('aiModel')}:</strong> gpt-5-codex
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        <strong>{t('totalQuota')}:</strong> ${parseFloat(trialPlan.quota).toFixed(2)}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        <strong>{t('apiKeysQuota')}:</strong> {t('apiKeysCount', { count: 3 })}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full py-4 text-base font-semibold bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  onClick={() => handleOneTimePay(trialPlan)}
                  disabled={subscribingPlanId !== null}
                >
                  {subscribingPlanId !== null ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('subscriptionDialog.processing')}
                    </>
                  ) : (
                    t('cta') || 'Get Started'
                  )}
                </Button>

                {/* CNY Payment Link */}
                {trialCnyPlan && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      className="w-full py-3 text-sm border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200"
                      variant="outline"
                      onClick={() => handleOneTimePay(trialCnyPlan)}
                      disabled={subscribingPlanId !== null}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1">
                          <Image src="/alipay.png" alt="支付宝" width={18} height={18} className="h-4 w-auto" />
                          <Image src="/wxpay.png" alt="微信支付" width={18} height={18} className="h-4 w-auto" />
                        </div>
                        <span>支付宝或微信支付</span>
                      </div>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Plus Card - Featured */}
          {plusPlans.length > 0 && (
            <div className="relative group scale-105">
              {/* Featured badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold shadow-lg">
                  <Star className="w-4 h-4 mr-2" />
                  {t('featuredBadge') || 'Most Popular'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 shadow-lg">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-6 shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Plus
                  </h3>
                  <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                    {t('plusSubtitle')}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      ${(plusPlans[0].amount / 100).toFixed(2)}
                    </span>
                    <span className="text-xl text-gray-600 dark:text-gray-300 ml-2">
                      /{getIntervalLabel(plusPlans[0].interval)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    {t('featuresList')}
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-200">
                        <strong>{t('validityPeriod')}:</strong> {t('thirtyDays')}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-200">
                        <strong>{t('aiModel')}:</strong> gpt-5-codex
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-200">
                        <strong>{t('monthlyQuota')}:</strong> ${parseFloat(plusPlans[0].quota).toFixed(2)}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-200">
                        <strong>{t('apiKeysQuota')}:</strong> {t('apiKeysCount', { count: 10 })}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full py-4 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  onClick={handlePlusSubscribe}
                  disabled={subscribingPlanId !== null}
                >
                  {subscribingPlanId !== null ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('subscriptionDialog.processing')}
                    </>
                  ) : (
                    t('ctaFeatured') || 'Start Now'
                  )}
                </Button>

                {/* CNY Payment Link */}
                {plusCnyPlan && (
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-purple-700">
                    <Button
                      className="w-full py-3 text-sm border-blue-300 dark:border-purple-600 hover:border-blue-400 dark:hover:border-purple-500 text-blue-700 dark:text-purple-300 hover:bg-blue-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200"
                      variant="outline"
                      onClick={() => handleOneTimePay(plusCnyPlan)}
                      disabled={subscribingPlanId !== null}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1">
                          <Image src="/alipay.png" alt="支付宝" width={18} height={18} className="h-4 w-auto" />
                          <Image src="/wxpay.png" alt="微信支付" width={18} height={18} className="h-4 w-auto" />
                        </div>
                        <span>支付宝或微信支付</span>
                      </div>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pro Card */}
          {proPlans.length > 0 && (
            <div className="relative group">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-8 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-700 dark:to-pink-700 rounded-2xl mb-6">
                    <Star className="w-8 h-8 text-purple-600 dark:text-purple-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Pro
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t('proSubtitle')}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      ${(proPlans[0].amount / 100).toFixed(2)}
                    </span>
                    <span className="text-xl text-gray-600 dark:text-gray-300 ml-2">
                      /{getIntervalLabel(proPlans[0].interval)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    {t('featuresList')}
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        <strong>{t('validityPeriod')}:</strong> {t('thirtyDays')}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        <strong>{t('aiModel')}:</strong> gpt-5-codex
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        <strong>{t('monthlyQuota')}:</strong> ${parseFloat(proPlans[0].quota).toFixed(2)}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        <strong>{t('apiKeysQuota')}:</strong> {t('apiKeysCount', { count: 50 })}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full py-4 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  onClick={handleProSubscribe}
                  disabled={subscribingPlanId !== null}
                >
                  {subscribingPlanId !== null ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('subscriptionDialog.processing')}
                    </>
                  ) : (
                    t('cta') || 'Get Started'
                  )}
                </Button>

                {/* CNY Payment Link */}
                {proCnyPlan && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      className="w-full py-3 text-sm border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200"
                      variant="outline"
                      onClick={() => handleOneTimePay(proCnyPlan)}
                      disabled={subscribingPlanId !== null}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1">
                          <Image src="/alipay.png" alt="支付宝" width={18} height={18} className="h-4 w-auto" />
                          <Image src="/wxpay.png" alt="微信支付" width={18} height={18} className="h-4 w-auto" />
                        </div>
                        <span>支付宝或微信支付</span>
                      </div>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Subscription Cycle Dialog */}
        {selectedPlan && (
          <>
            {plusPlans.length > 0 && selectedPlan.membershipLevel === 'plus' && (
              <SubscriptionCycleDialog
                planName="Plus"
                cycles={getSubscriptionCycles(plusPlans)}
              />
            )}
            {proPlans.length > 0 && selectedPlan.membershipLevel === 'pro' && (
              <SubscriptionCycleDialog
                planName="Pro"
                cycles={getSubscriptionCycles(proPlans)}
              />
            )}
          </>
        )}

      </div>
    </section>
  );
}