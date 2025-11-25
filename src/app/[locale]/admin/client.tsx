'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Users, DollarSign, Activity, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/header';
import { FlexibleChart } from '@/components/ui/flexible-chart';
import { useAdminDashboard } from '@/hooks/useAdmin';

export function AdminDashboardClient() {
  const t = useTranslations('admin');

  // Use the admin dashboard hook - handles all auth and admin checking
  const {
    isAdmin,
    adminStats,
    monthlyMetrics,
    loading,
  } = useAdminDashboard(12);

  // Debug logging
  // console.log('Admin Dashboard State:', { isAdmin, loading, adminStats, monthlyMetrics });

  // Handle access denied or non-admin users
  useEffect(() => {
    // If we've determined the user is not admin, redirect them
    if (isAdmin === false) {
      window.location.assign('/');
    }
  }, [isAdmin]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const formatters: { [key: string]: Intl.NumberFormat } = {
      USD: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
      CNY: new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
      }),
      EUR: new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }),
    };

    const formatter = formatters[currency.toUpperCase()] || formatters.USD;
    return formatter.format(amount);
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toLocaleString();
  };

  // Helper function to get primary revenue (USD as base, fallback to first available)
  const getPrimaryRevenue = (revenueByCurrency: { [currency: string]: { amount: number; currency: string; count?: number } }) => {
    try {
      // Use USD if available, otherwise use the first currency found
      if (revenueByCurrency.USD) {
        return revenueByCurrency.USD.amount;
      }
      const firstCurrency = Object.values(revenueByCurrency)[0];
      return firstCurrency ? firstCurrency.amount : 0;
    } catch (error) {
      console.error('Error in getPrimaryRevenue:', error);
      return 0;
    }
  };

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const hasCurrentMonth = monthlyMetrics.some(metric => metric.month === currentMonth);

  let transformedMonthlyMetrics: Array<{
    month: string;
    users: number;
    revenue: number;
    revenueByCurrency: { [currency: string]: { amount: number; currency: string; count?: number } };
    inputTokens: number;
    cachedTokens: number;
    outputTokens: number;
    totalTokens: number;
    subscriptions: number;
    cnyRevenue: number;
    usdRevenue: number;
    totalRevenue: number;
    quota: number;
  }>;

  try {
    transformedMonthlyMetrics = monthlyMetrics.map(metric => {
      try {
        return {
          ...metric,
          cnyRevenue: metric.revenueByCurrency?.CNY?.amount || 0,
          usdRevenue: metric.revenueByCurrency?.USD?.amount || 0,
          totalRevenue: getPrimaryRevenue(metric.revenueByCurrency || {}),
          quota: 0 // TODO: Add actual monthly quota data when available
        };
      } catch (error) {
        console.error('Error transforming metric:', metric, error);
        return {
          month: metric.month || 'unknown',
          users: 0,
          revenue: 0,
          revenueByCurrency: {},
          inputTokens: 0,
          cachedTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          subscriptions: 0,
          cnyRevenue: 0,
          usdRevenue: 0,
          totalRevenue: 0,
          quota: 0
        };
      }
    });
  } catch (error) {
    console.error('Error in transformedMonthlyMetrics:', error);
    transformedMonthlyMetrics = [];
  }

  // If current month is not included, add it with zero values
  if (!hasCurrentMonth) {
    transformedMonthlyMetrics = [
      ...transformedMonthlyMetrics,
      {
        month: currentMonth,
        users: 0,
        revenue: 0,
        revenueByCurrency: {
          USD: { amount: 0, currency: 'USD', count: 0 },
          CNY: { amount: 0, currency: 'CNY', count: 0 }
        },
        inputTokens: 0,
        cachedTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        subscriptions: 0,
        cnyRevenue: 0,
        usdRevenue: 0,
        totalRevenue: 0,
        quota: 0
      }
    ].sort((a, b) => a.month.localeCompare(b.month));
  }

  // console.log("Hook state:", { loading, isAdmin, adminStats, monthlyMetrics });

  // Show loading state while checking admin status
  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if admin check failed
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground">{'You do not have admin privileges'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>

        {adminStats ? (
          <>
            {/* Overview Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">{t('overview')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Users Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('users.title')}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{adminStats.users.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-500">{adminStats.users.growth}</span> new users this month
                    </p>
                  </CardContent>
                </Card>

                {/* Revenue Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('revenue.title')}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold space-y-1 text-foreground">
                      <div className="flex items-center gap-3 flex-wrap">
                        {adminStats.revenue.totalByCurrency.USD && (
                          <span>{formatCurrency(adminStats.revenue.totalByCurrency.USD.amount)}</span>
                        )}
                        {adminStats.revenue.totalByCurrency.USD && adminStats.revenue.totalByCurrency.CNY && (
                          <span className="text-muted-foreground"></span>
                        )}
                        {adminStats.revenue.totalByCurrency.CNY && (
                          <span>{formatCurrency(adminStats.revenue.totalByCurrency.CNY.amount, 'CNY')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {adminStats.revenue.monthlyByCurrency.USD && (
                          <span>{formatCurrency(adminStats.revenue.monthlyByCurrency.USD.amount)}</span>
                        )}
                        {adminStats.revenue.monthlyByCurrency.USD && adminStats.revenue.monthlyByCurrency.CNY && (
                          <span className="text-gray-400">•</span>
                        )}
                        {adminStats.revenue.monthlyByCurrency.CNY && (
                          <span>{formatCurrency(adminStats.revenue.monthlyByCurrency.CNY.amount, 'CNY')}</span>
                        )}
                        <span> revenue this month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('usage.title')}</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{formatTokens(adminStats.usage.inputTokens + adminStats.usage.cachedTokens + adminStats.usage.outputTokens)}</div>
                    <p className="text-xs text-muted-foreground">
                      ${adminStats.quota.used} quota used
                    </p>
                  </CardContent>
                </Card>

                {/* Subscriptions Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('subscriptions.title')}</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{adminStats.subscriptions.active}</div>
                    <p className="text-xs text-muted-foreground">
                      {adminStats.subscriptions.monthlySubscriptions} new subscriptions this month
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>


            {/* Charts Section */}
            {monthlyMetrics.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-foreground mb-6">Monthly Trends</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Users & Subscriptions Chart */}
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Users & Subscriptions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <FlexibleChart
                        data={monthlyMetrics}
                        title=""
                        metrics={[
                          {
                            key: 'users',
                            name: 'New Users',
                            color: '#3b82f6' // blue
                          },
                          {
                            key: 'subscriptions',
                            name: 'New Subscriptions',
                            color: '#8b5cf6' // violet
                          }
                        ]}
                        height={350}
                      />
                    </CardContent>
                  </Card>

                  {/* Revenue & Token Usage Chart */}
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Revenue & Token Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <FlexibleChart
                        data={transformedMonthlyMetrics}
                        title=""
                        metrics={[
                          {
                            key: 'totalTokens',
                            name: 'Tokens Used',
                            color: '#f59e0b', // amber
                            yAxis: 'left',
                            formatter: (value: number) => {
                              if (value >= 1000000) {
                                return `${(value / 1000000).toFixed(1)}M`;
                              } else if (value >= 1000) {
                                return `${(value / 1000).toFixed(1)}K`;
                              }
                              return value.toLocaleString();
                            }
                          },
                          {
                            key: 'usdRevenue',
                            name: 'USD Revenue',
                            color: '#10b981', // green
                            yAxis: 'right',
                            formatter: (value: number) => {
                              return formatCurrency(value);
                            }
                          },
                          {
                            key: 'cnyRevenue',
                            name: 'CNY Revenue',
                            color: '#ef4444', // red
                            yAxis: 'right',
                            formatter: (value: number) => {
                              return formatCurrency(value, 'CNY');
                            }
                          },
                          {
                            key: 'quota',
                            name: 'Quota Used',
                            color: '#8b5cf6', // violet
                            yAxis: 'right',
                            formatter: (value: number) => {
                              return formatCurrency(value);
                            }
                          }
                        ]}
                        height={350}
                        showRightAxis={true}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
