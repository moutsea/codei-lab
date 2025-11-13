'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Star, Zap, Users, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          const existingCurrency = errorData.existingCurrency || 'USD';
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
    handleSubscribe(plan);
  };

  const handlePlusSubscribe = () => {
    if (plusPlans.length > 0) {
      setSelectedPlan(plusPlans[0]); // Use the first plan as base
      setShowCycleDialog(true);
    }
  };

  const handleProSubscribe = () => {
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

  if (loading) {
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 section-themed">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Trial Card */}
          {trialPlan && (
            <Card className="transition-all duration-300 hover:shadow-xl bg-card border border-border">
              <CardHeader className="text-center pb-4">
                <div className="mb-4 text-center flex justify-center text-primary">
                  <Zap className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Trial
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('trialSubtitle')}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1 text-foreground">
                    ${(trialPlan.amount / 100).toFixed(2)}
                  </div>
                  <div className="text-lg font-normal text-muted-foreground">
                    {t('forOneWeek', { duration: getIntervalLabel(trialPlan.interval) })}
                  </div>
                </div>

                {/* Quota */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-sm font-medium mb-1 text-muted-foreground">
                    {t('totalQuota')}
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    ${trialPlan.quota}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('featuresList')}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-green-500'} />
                      <span>{t('validityPeriod')}: {t('sevenDays')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-green-500'} />
                      <span>{t('aiModel')}: gpt-5-codex</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-green-500'} />
                      <span>{t('totalQuota')}: $30</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-green-500'} />
                      <span>{t('apiKeysQuota')}: {t('apiKeysCount', { count: 3 })}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full cursor-pointer py-3 text-base font-semibold"
                  onClick={() => handleOneTimePay(trialPlan)}
                  disabled={subscribingPlanId !== null}
                >
                  {subscribingPlanId === trialPlan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('subscriptionDialog.processing')}
                    </>
                  ) : (
                    t('cta') || 'Get Started'
                  )}
                </Button>

                {/* CNY Payment Link */}
                {trialCnyPlan && (
                  <Button
                    className="w-full cursor-pointer py-2 text-sm border-0 bg-background/50 hover:bg-primary hover:text-white"
                    variant="ghost"
                    onClick={() => handleOneTimePay(trialCnyPlan)}
                    disabled={subscribingPlanId !== null}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Image src="/alipay.png" alt="支付宝" width={20} height={20} className="h-5 w-auto" />
                      <Image src="/wxpay.png" alt="微信支付" width={20} height={20} className="h-5 w-auto" />
                      <span>支付宝或微信支付</span>
                    </div>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Plus Card */}
          {plusPlans.length > 0 && (
            <Card className="relative transition-all duration-300 hover:shadow-xl ring-4 ring-primary/20 scale-105 bg-primary text-primary-foreground">
              {/* Featured Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <Star className="w-4 h-4" />
                {t('featuredBadge') || 'Most Popular'}
              </div>

              <CardHeader className="text-center pb-4">
                <div className="mb-4 text-center flex justify-center text-primary-foreground">
                  <Users className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-primary-foreground">
                  Plus
                </CardTitle>
                <p className="text-sm text-primary-foreground/80 mt-2">
                  {t('plusSubtitle')}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1 text-primary-foreground">
                    ${(plusPlans[0].amount / 100).toFixed(2)}
                    <span className="text-lg font-normal text-primary-foreground/70">
                      /{getIntervalLabel(plusPlans[0].interval)}
                    </span>
                  </div>
                </div>

                {/* Quota */}
                <div className="text-center p-4 rounded-lg bg-primary-foreground/10">
                  <div className="text-sm font-medium mb-1 text-primary-foreground/80">
                    {t('monthlyQuota')}
                  </div>
                  <div className="text-xl font-bold text-primary-foreground">
                    ${plusPlans[0].quota}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-primary-foreground/80">
                    {t('featuresList')}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-primary-foreground'} />
                      <span>{t('validityPeriod')}: {t('thirtyDays')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-primary-foreground'} />
                      <span>{t('aiModel')}: gpt-5-codex</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-primary-foreground'} />
                      <span>{t('monthlyQuota')}: $100</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-primary-foreground'} />
                      <span>{t('apiKeysQuota')}: {t('apiKeysCount', { count: 10 })}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full cursor-pointer py-3 text-base font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  variant="secondary"
                  onClick={handlePlusSubscribe}
                  disabled={subscribingPlanId !== null}
                >
                  {subscribingPlanId !== null ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('subscriptionDialog.processing')}
                    </>
                  ) : (
                    t('ctaFeatured') || 'Start Now'
                  )}
                </Button>

                {/* CNY Payment Link */}
                {plusCnyPlan && (
                  <Button
                    className="w-full cursor-pointer py-2 text-sm border-0 "
                    variant="ghost"
                    onClick={() => handleOneTimePay(plusCnyPlan)}
                    disabled={subscribingPlanId !== null}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Image src="/alipay.png" alt="支付宝" width={20} height={20} className="h-5 w-auto" />
                      <Image src="/wxpay.png" alt="微信支付" width={20} height={20} className="h-5 w-auto" />
                      <span>支付宝或微信支付</span>
                    </div>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pro Card */}
          {proPlans.length > 0 && (
            <Card className="transition-all duration-300 hover:shadow-xl bg-card border border-border">
              <CardHeader className="text-center pb-4">
                <div className="mb-4 text-center flex justify-center text-primary">
                  <Star className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Pro
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('proSubtitle')}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1 text-foreground">
                    ${(proPlans[0].amount / 100).toFixed(2)}
                    <span className="text-lg font-normal text-muted-foreground">
                      /{getIntervalLabel(proPlans[0].interval)}
                    </span>
                  </div>
                </div>

                {/* Quota */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-sm font-medium mb-1 text-muted-foreground">
                    {t('monthlyQuota')}
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    ${proPlans[0].quota}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('featuresList')}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-green-500'} />
                      <span>{t('validityPeriod')}: {t('thirtyDays')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-green-500'} />
                      <span>{t('aiModel')}: gpt-5-codex</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-green-500'} />
                      <span>{t('monthlyQuota')}: $500</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={'w-4 h-4 text-green-500'} />
                      <span>{t('apiKeysQuota')}: {t('apiKeysCount', { count: 50 })}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full cursor-pointer py-3 text-base font-semibold"
                  onClick={handleProSubscribe}
                  disabled={subscribingPlanId !== null}
                >
                  {subscribingPlanId !== null ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('subscriptionDialog.processing')}
                    </>
                  ) : (
                    t('cta') || 'Get Started'
                  )}
                </Button>

                {/* CNY Payment Link */}
                {proCnyPlan && (
                  <Button
                    className="w-full cursor-pointer py-2 text-sm border-0 bg-background/50 hover:bg-primary hover:text-white"
                    variant="ghost"
                    onClick={() => handleOneTimePay(proCnyPlan)}
                    disabled={subscribingPlanId !== null}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Image src="/alipay.png" alt="支付宝" width={20} height={20} className="h-5 w-auto" />
                      <Image src="/wxpay.png" alt="微信支付" width={20} height={20} className="h-5 w-auto" />
                      <span>支付宝或微信支付</span>
                    </div>
                  </Button>
                )}
              </CardContent>
            </Card>
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