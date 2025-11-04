'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useUser } from '@auth0/nextjs-auth0';
import { useRouter } from 'next/navigation';
import { Users, DollarSign, Activity, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/header';
import { FlexibleChart } from '@/components/ui/flexible-chart';

interface AdminStats {
  users: {
    total: number;
    growth: string;
  };
  revenue: {
    total: number;
    monthly: number;
    totalByCurrency: {
      [currency: string]: {
        amount: number;
        currency: string;
        count: number;
      };
    };
    monthlyByCurrency: {
      [currency: string]: {
        amount: number;
        currency: string;
        count: number;
      };
    };
  };
  usage: {
    totalTokens: number;
    monthlyTokens: number;
  };
  subscriptions: {
    active: number;
    total: number;
    monthlySubscriptions: number;
  };
}

interface MonthlyMetrics {
  month: string;
  users: number;
  revenue: number;
  revenueByCurrency: {
    [currency: string]: {
      amount: number;
      currency: string;
    };
  };
  tokens: number;
  subscriptions: number;
}

export function AdminDashboardClient() {
  const t = useTranslations('admin');
  const { user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Only redirect if we've confirmed there's no user after initial loading
    if (authChecked && !user) {
      window.location.assign('/');
      return;
    }

    if (user) {
      setAuthChecked(true);
      // fetchStats();
      fetchMonthlyMetrics();
    } else if (!authChecked) {
      // Give Auth0 time to load
      const timer = setTimeout(() => {
        setAuthChecked(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, router, authChecked]);

  const fetchMonthlyMetrics = useCallback(async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      console.log('Fetching monthly metrics for user:', user?.sub, 'Current month should be:', currentMonth);

      const response = await fetch('/api/admin/monthly-metrics?months=12', {
        headers: {
          'x-user-id': user?.sub || '',
        },
      });

      if (!response.ok) {
        console.log('Failed to fetch monthly metrics:', response.status);
        return;
      }

      const data = await response.json();
      console.log('Monthly metrics API response:', data);

      if (data.success) {
        setMonthlyMetrics(data.data);
        setStats(data.auth);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching monthly metrics:', error);
    }
  }, []);

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
    // Use USD if available, otherwise use the first currency found
    if (revenueByCurrency.USD) {
      return revenueByCurrency.USD.amount;
    }
    const firstCurrency = Object.values(revenueByCurrency)[0];
    return firstCurrency ? firstCurrency.amount : 0;
  };

  // Transform monthly metrics to include all revenue data and ensure current month is included
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const hasCurrentMonth = monthlyMetrics.some(metric => metric.month === currentMonth);

  let transformedMonthlyMetrics = monthlyMetrics.map(metric => ({
    ...metric,
    cnyRevenue: metric.revenueByCurrency.CNY?.amount || 0,
    usdRevenue: metric.revenueByCurrency.USD?.amount || 0,
    totalRevenue: getPrimaryRevenue(metric.revenueByCurrency)
  }));

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
        tokens: 0,
        subscriptions: 0,
        cnyRevenue: 0,
        usdRevenue: 0,
        totalRevenue: 0
      }
    ].sort((a, b) => a.month.localeCompare(b.month));
  }

  if (!user) {
    return null;
  }

  if (error) {
    window.location.assign("/");
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>

        {loading || !authChecked ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {!authChecked ? 'Checking authentication...' : t('loading')}
              </p>
            </div>
          </div>
        ) : stats ? (
          <>
            {/* Overview Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('overview')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Users Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('users.title')}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{stats.users.growth}</span> new users this month
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
                    <div className="text-2xl font-bold space-y-1">
                      <div className="flex items-center gap-3">
                        {stats.revenue.totalByCurrency.USD && (
                          <span>{formatCurrency(stats.revenue.totalByCurrency.USD.amount)}</span>
                        )}
                        {stats.revenue.totalByCurrency.USD && stats.revenue.totalByCurrency.CNY && (
                          <span className="text-gray-400"></span>
                        )}
                        {stats.revenue.totalByCurrency.CNY && (
                          <span>{formatCurrency(stats.revenue.totalByCurrency.CNY.amount, 'CNY')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {stats.revenue.monthlyByCurrency.USD && (
                          <span>{formatCurrency(stats.revenue.monthlyByCurrency.USD.amount)}</span>
                        )}
                        {stats.revenue.monthlyByCurrency.USD && stats.revenue.monthlyByCurrency.CNY && (
                          <span className="text-gray-400">•</span>
                        )}
                        {stats.revenue.monthlyByCurrency.CNY && (
                          <span>{formatCurrency(stats.revenue.monthlyByCurrency.CNY.amount, 'CNY')}</span>
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
                    <div className="text-2xl font-bold">{formatTokens(stats.usage.totalTokens)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatTokens(stats.usage.monthlyTokens)} tokens this month
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
                    <div className="text-2xl font-bold">{stats.subscriptions.active}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.subscriptions.monthlySubscriptions} new subscriptions this month
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>


            {/* Charts Section */}
            {monthlyMetrics.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Monthly Trends</h2>
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
                            key: 'tokens',
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