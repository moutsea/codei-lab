'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Star, Rocket, Users, Zap, Shield, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NonRecurringPaymentDialog } from '@/components/non-recurring-payment-dialog';
import { usePlans, type PlanWithPricing } from '@/hooks/usePlans';
import { I18nBillingIntervalSelector } from '@/components/billing-interval-selector';
import { useUser } from '@auth0/nextjs-auth0';
import React, { useState } from 'react';
import { useUserData } from '@/hooks/useUserData';

export default function Pricing() {
  const t = useTranslations('pricingSection');
  const currentLocale = useLocale();
  const { user } = useUser();
  const [showNonRecurringDialog, setShowNonRecurringDialog] = useState(false);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

  const {
    userDetail,
    isActive,
    loading: userDataLoading,
  } = useUserData();

  const {
    plans,
    nonRecurringPlans,
    loading: plansLoading,
    nonRecurringLoading,
    error,
    selectedInterval,
    setSelectedInterval,
    getPlanPrice,
    getPlanDiscount,
  } = usePlans();

  // Translation helper for parameterized strings
  const translateFeature = (key: string, params?: Record<string, number>) => {
    if (!params) {
      return t(key);
    }

    switch (key) {
      case 'apiKeys':
        switch (currentLocale) {
          case 'zh':
            return `${params.count} 个独立 API 密钥`;
          case 'fr':
            return `${params.count} clés API individuelles`;
          default:
            return `${params.count} individual API keys`;
        }
      case 'tokensOff':
        switch (currentLocale) {
          case 'zh':
            return `${params.percent}% 令牌折扣`;
          case 'fr':
            return `${params.percent}% de réduction sur les tokens`;
          default:
            return `${params.percent}% tokens off`;
        }
      default:
        return t(key);
    }
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 100000000) {
      const value = (tokens / 100000000).toFixed(0);
      return `${value}00M`;
    } else if (tokens >= 10000000) {
      const value = (tokens / 10000000).toFixed(0);
      return `${value}0M`;
    } else if (tokens >= 1000000) {
      const value = (tokens / 1000000).toFixed(1);
      return `${value}M`;
    } else if (tokens >= 1000) {
      const value = (tokens / 1000).toFixed(0);
      return `${value}K`;
    }
    return tokens.toLocaleString();
  };

  const getIntervalLabel = () => {
    switch (selectedInterval) {
      case 'quarter':
        return t('quarter');
      case 'year':
        return t('year');
      default:
        return t('month');
    }
  };

  const getProcessingText = () => {
    switch (currentLocale) {
      case 'zh':
        return '处理中...';
      case 'fr':
        return 'En cours...';
      default:
        return 'Processing...';
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

  const handleNonRecurringClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If user has active subscription with stripeSubscriptionId, redirect to billing portal
    if (isActive && userDetail?.stripeSubscriptionId) {
      handleBillingPortal();
    } else {
      // Otherwise, open the non-recurring dialog
      setShowNonRecurringDialog(true);
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('lite') || name.includes('basic')) {
      return <Rocket className="w-8 h-8" />;
    } else if (name.includes('pro') || name.includes('premium')) {
      return <Star className="w-8 h-8" />;
    } else if (name.includes('team') || name.includes('enterprise')) {
      return <Users className="w-8 h-8" />;
    } else {
      return <Zap className="w-8 h-8" />;
    }
  };

  const getPlanFeatures = (planName: string) => {
    const name = planName.toLowerCase();

    if (name.includes('lite') || name.includes('basic')) {
      return [
        { key: 'claudeModel', params: {} },
        { key: 'apiKeys', params: { count: 3 } }
      ];
    } else if (name.includes('pro') || name.includes('premium')) {
      return [
        { key: 'claudeModel', params: {} },
        { key: 'apiKeys', params: { count: 10 } },
        { key: 'tokensOff', params: { percent: 10 } }
      ];
    } else if (name.includes('team') || name.includes('enterprise')) {
      return [
        { key: 'claudeModel', params: {} },
        { key: 'apiKeys', params: { count: 50 } },
        { key: 'tokensOff', params: { percent: 15 } }
      ];
    } else {
      // Default features for unknown plan types
      return [
        { key: 'allModels', params: {} },
        { key: 'prioritySupport', params: {} },
        { key: 'apiAccess', params: {} }
      ];
    }
  };

  const isFeaturedPlan = (plan: PlanWithPricing, index: number) => {
    // 通常中间的计划是特色计划
    return index === 1 || plan.name.toLowerCase().includes('pro');
  };

  const handleSubscribe = async (plan: PlanWithPricing) => {
    try {
      if (typeof window === 'undefined') {
        console.error('Stripe can only be used in browser environment');
        return;
      }

      if (!user?.sub) {
        window.location.assign("/auth/login");
        return;
      }

      setSubscribingPlanId(plan.id);

      // Check if user has an active one-payment plan (no subscription ID)
      if (isActive && !userDetail?.stripeSubscriptionId) {
        console.log('User has active one-payment plan, opening non-recurring dialog');
        setSubscribingPlanId(null);
        setShowNonRecurringDialog(true);
        return;
      }

      if (isActive) {
        await handleBillingPortal();
        setSubscribingPlanId(null);
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: plan.stripePriceId,
          requestLimit: plan.requestLimit,
          interval: selectedInterval,
          membershipLevel: plan.membershipLevel,
          auth0Id: user.sub,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.open(url);
    } catch (error) {
      console.error('Subscription error:', error);
      // 可以在这里显示错误提示
      alert(error instanceof Error ? error.message : 'Failed to process subscription. Please try again.');
    } finally {
      setSubscribingPlanId(null);
    }
  };

  if (userDataLoading || plansLoading) {
    return (
      <section className="py-20 bg-[#faf9f5]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
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
      <section className="py-20 bg-[#faf9f5]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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

  if (plans.length === 0) {
    return (
      <section className="py-20 bg-[#faf9f5]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t('noPlansTitle')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('noPlansDescription')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-[#faf9f5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('subtitle')}
          </p>

          {/* Billing Interval Selector Container with Payment Methods */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-4 min-w-0">
            {/* CNY payments */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
              使用
              <Image src="/alipay.png" alt="支付宝" width={20} height={20} className="h-5 w-auto" />
              支付宝或
              <Image src="/wxpay.png" alt="微信支付" width={20} height={20} className="h-5 w-auto" />
              微信支付？
              <NonRecurringPaymentDialog
                open={showNonRecurringDialog}
                onOpenChange={setShowNonRecurringDialog}
                plans={nonRecurringPlans}
                loading={nonRecurringLoading}
                hideTrigger={false}
              >
                <Button
                  variant="link"
                  size="sm"
                  className="text-sm h-auto font-normal -ml-3 cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={handleNonRecurringClick}
                >
                  点此付款
                </Button>
              </NonRecurringPaymentDialog>
            </div>

            {/* Billing Interval Selector */}
            <div className="flex-shrink-0">
              <I18nBillingIntervalSelector
                value={selectedInterval}
                onChange={setSelectedInterval}
                t={t}
                className="justify-center"
              />
            </div>
            {/* Empty spacer to balance layout and center Billing Interval Selector */}
            <div className="flex-shrink-0 w-72"></div>
          </div>

        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const featured = isFeaturedPlan(plan, index);
            const price = getPlanPrice(plan);
            const discount = getPlanDiscount(plan);
            const icon = getPlanIcon(plan.name);

            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-300 hover:shadow-xl ${featured
                  ? 'ring-4 ring-primary/20 scale-105 bg-primary text-primary-foreground'
                  : 'bg-[#faf9f5] border border-gray-200'
                  }`}
              >
                {/* Featured Badge */}
                {featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {t('featuredBadge')}
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  {/* Plan Icon */}
                  <div className={`mb-4 text-center flex justify-center ${featured ? 'text-primary-foreground' : 'text-primary'}`}>
                    {icon}
                  </div>

                  {/* Plan Name */}
                  <CardTitle className={`text-2xl font-bold ${featured ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {plan.name}
                  </CardTitle>

                  {/* Description */}
                  {plan.description && (
                    <p className={`text-sm ${featured ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {plan.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-1 ${featured ? 'text-primary-foreground' : 'text-foreground'}`}>
                      ${price.toFixed(2)}
                      <span className={`text-lg font-normal ${featured ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        /{getIntervalLabel()}
                      </span>
                    </div>

                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${featured ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
                        {discount}% OFF
                      </div>
                    )}
                  </div>

                  {/* Request Limit */}
                  <div className={`text-center p-4 rounded-lg ${featured ? 'bg-primary-foreground/10' : 'bg-gray-100'}`}>
                    <div className={`text-sm font-medium mb-1 ${featured ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {t('includesRequests')}
                    </div>
                    <div className={`text-xl font-bold ${featured ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {formatTokens(plan.requestLimit)} {t('requests')}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <div className={`text-sm font-medium ${featured ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {t('features')}
                    </div>

                    <div className="space-y-2">
                      {getPlanFeatures(plan.name).map((feature, index) => {
                        const featureText = Object.keys(feature.params).length > 0
                          ? translateFeature(feature.key, feature.params as Record<string, number>)
                          : t(feature.key);

                        return (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className={`w-4 h-4 ${featured ? 'text-primary-foreground' : 'text-green-500'}`} />
                            <span className={`text-sm ${featured ? 'text-primary-foreground' : 'text-foreground'}`}>
                              {featureText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full cursor-pointer py-3 text-base font-semibold transition-all duration-300 ${featured
                      ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 '
                      }`}
                    variant={featured ? 'secondary' : 'default'}
                    onClick={() => handleSubscribe(plan)}
                    disabled={userDataLoading || plansLoading || subscribingPlanId === plan.id}
                  >
                    {subscribingPlanId === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {getProcessingText()}
                      </>
                    ) : (
                      <>
                        {featured ? t('ctaFeatured') : t('cta')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            {t('allPlansInclude')}
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              {t('securePayment')}
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {t('instantAccess')}
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {t('cancelAnytime')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}