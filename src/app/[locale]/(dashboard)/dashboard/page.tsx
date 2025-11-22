"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DailyUsageChart } from "@/components/ui/daily-usage-chart";
import { MonthPicker } from "@/components/ui/month-picker";
import Tutorial from "@/components/tutorial/tutorial";
import { useUserData } from "@/hooks/useUserData";
import { usePlans } from "@/hooks/usePlans";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlanWithPricing } from "@/types/plan";

interface TokenStats {
  total: number;
  used: number;
}

interface DailyUsage {
  date: string;
  cachedTokens: number;
  inputTokens: number;
  outputTokens: number;
}

interface DailyUsageItem {
  date: string;
  cachedTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number; // Backward compatibility
}

// Use PlanWithPricing from usePlans hook
export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const {
    userDetail,
    usageData,
    // topUpRecord,
    isActive,
    quota,
    membershipLevel,
    loading,
    fetchDailyUsageData
  } = useUserData({ enableCache: true });

  const {
    extraPlans,
    renewPlans,
    payPlans,
    isLoading: plansLoading,
  } = usePlans();

  const [dailyUsageData, setDailyUsageData] = useState<DailyUsage[]>([]);
  const [loadingDailyUsage, setLoadingDailyUsage] = useState(false);

  const t = useTranslations("sidebar");
  const dt = useTranslations("dashboard");

  // Hook automatically fetches data when user is authenticated

  // All state hooks must be declared before any conditional returns
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    total: 30, // 默认值50M，会被实际计划值覆盖
    used: 0
  });

  // 当使用数据加载完成后更新token统计
  useEffect(() => {
    if (usageData && quota !== undefined) {
      // 使用新的 usage data结构
      const used = usageData.totalQuotaUsed || 0;
      const total = quota || 30;
      // console.log(`Using requestLimit: ${total}, tokens used: ${used}, usagePercentage: ${total > 0 ? (used / total) * 100 : 0}%`);
      setTokenStats({
        total,
        used
      });
    }
  }, [usageData, quota]);

  const [selectedMonth, setSelectedMonth] = useState(new Date()); // Date object for react-datepicker
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [topUpPlanId, setTopUpPlanId] = useState<string | null>(null);
  const [renewPlanId, setRenewPlanId] = useState<string | null>(null);
  const [upgradePlanId, setUpgradePlanId] = useState<string | null>(null);

  // 获取特定月份的每日使用数据
  const fetchDailyUsageForMonth = useCallback(async (date: Date) => {
    if (!fetchDailyUsageData) return;

    try {
      setLoadingDailyUsage(true);

      // 计算月份的开始和结束日期
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth() returns 0-11

      // 获取指定年、月的起止日期（按本地时间）
      function getMonthRange(year: number, month: number) {
        const startDate = new Date(year, month - 1, 1); // 当月第一天
        const endDate = new Date(year, month, 0);       // 当月最后一天
        return { startDate, endDate };
      }

      // 本地安全格式化为 YYYY-MM-DD（避免 toISOString 受时区影响）
      function formatLocalDate(d: Date) {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }

      const { startDate, endDate } = getMonthRange(year, month);

      // 使用 hook 中的函数
      const dailyUsage = await fetchDailyUsageData(
        formatLocalDate(startDate),
        formatLocalDate(endDate)
      );

      // console.log(`Fetched daily usage for ${year}-${month.toString().padStart(2, '0')}:`, dailyUsage);

      // 转换数据格式以匹配 DailyUsage 接口
      const formattedData: DailyUsage[] = dailyUsage?.map((item: DailyUsageItem) => {
        // Handle new structure with individual token types
        if (item.cachedTokens !== undefined || item.inputTokens !== undefined || item.outputTokens !== undefined) {
          return {
            date: item.date,
            cachedTokens: item.cachedTokens || 0,
            inputTokens: item.inputTokens || 0,
            outputTokens: item.outputTokens || 0
          };
        }

        // Handle old structure with totalTokens - distribute it proportionally
        const totalTokens = item.totalTokens || 0;
        return {
          date: item.date,
          cachedTokens: Math.floor(totalTokens * 0.1),  // Assume 10% cached
          inputTokens: Math.floor(totalTokens * 0.6),   // Assume 60% input
          outputTokens: Math.floor(totalTokens * 0.3)  // Assume 30% output
        };
      }) || [];

      setDailyUsageData(formattedData);
    } catch (error) {
      console.error('Error fetching daily usage data:', error);
      setDailyUsageData([]);
    } finally {
      setLoadingDailyUsage(false);
    }
  }, [fetchDailyUsageData]);

  // 当选择的月份变化时，获取对应的每日使用数据
  useEffect(() => {
    if (user?.id && isActive) {
      fetchDailyUsageForMonth(selectedMonth);
    }
  }, [selectedMonth, user?.id, isActive, fetchDailyUsageForMonth]);


  const formatQuotaString = (quota: string) => {
    return parseFloat(quota).toFixed(2);
  };

  const usagePercentage = (typeof tokenStats.total === 'number' && tokenStats.total > 0 && typeof tokenStats.used === 'number')
    ? (tokenStats.used / tokenStats.total) * 100
    : 0;

  const handleMonthChange = (date: Date | null) => {
    if (date) {
      setSelectedMonth(date);
    }
  };

  const handleTopUp = async (plan: PlanWithPricing) => {
    try {
      if (!user?.email) {
        window.location.assign("/login");
        return;
      }

      setTopUpPlanId(plan.id);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: plan.stripePriceId,
          interval: plan.interval,
          userId: user.id,
          quota: plan.quota,
          currency: plan.currency,
          type: 'extra' // Mark as top-up
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.open(url);
    } catch (error) {
      console.error('Top-up error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process top-up. Please try again.');
    } finally {
      setTopUpPlanId(null);
      setShowTopUpDialog(false);
    }
  };

  const handleRenew = async (plan: PlanWithPricing) => {
    try {
      if (!user?.email) {
        window.location.assign("/login");
        return;
      }

      setRenewPlanId(plan.id);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: plan.stripePriceId,
          interval: plan.interval,
          userId: user.id,
          quota: plan.quota,
          currency: plan.currency,
          currentEndAt: userDetail?.currentEndAt,
          type: 'renew' // Mark as renew
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.open(url);
    } catch (error) {
      console.error('Renew error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process renew. Please try again.');
    } finally {
      setRenewPlanId(null);
      setShowRenewDialog(false);
    }
  };

  const handleRenewForUSD = async () => {
    try {
      const response = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stripeCustomerId: userDetail?.stripeCustomerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const { billingUrl } = await response.json();
      window.location.href = billingUrl;

    } catch (error) {
      console.error('Error creating billing portal session:', error);
      alert('Failed to open billing portal. Please try again later.');
    }
  };

  const handleRenewClick = () => {
    const userCurrency = userDetail?.currency?.toUpperCase();

    if (userCurrency === 'CNY') {
      setShowRenewDialog(true);
    } else if (userCurrency === 'USD') {
      handleRenewForUSD();
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

  const handleUpgrade = async (plan: PlanWithPricing) => {
    try {
      if (!user?.email) {
        window.location.assign("/login");
        return;
      }

      setUpgradePlanId(plan.id);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: plan.stripePriceId,
          interval: plan.interval,
          userId: user.id,
          quota: plan.quota,
          currency: plan.currency,
          type: 'pay' // Mark as one-time payment
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.open(url);
    } catch (error) {
      console.error('Upgrade error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process upgrade. Please try again.');
    } finally {
      setUpgradePlanId(null);
      setShowUpgradeDialog(false);
    }
  };

  const handleUpgradePlan = async () => {
    // Wait for user data to be loaded before making decisions
    if (isLoading || loading || !userDetail) {
      // console.log('User data still loading, please wait...');
      return;
    }

    const userCurrency = userDetail?.currency?.toUpperCase();

    // For USD users, check if they have an active one-payment plan (no subscription ID)
    if (isActive && userCurrency === 'USD') {
      // console.log('User has active one-payment plan, opening non-recurring dialog');
      handleBillingPortal();
      return;
    }

    if (userCurrency === 'CNY') {
      setShowUpgradeDialog(true);
      return;
    }

  };

  // Filter extra plans by user currency (extraPlans are already filtered by type='extra' from the hook)
  const extraPlansForUser = extraPlans?.filter(plan =>
    plan.currency.toLowerCase() === userDetail?.currency?.toLowerCase()
  ) || [];

  // Filter renew plans by user currency and membership level, then sort by interval (monthly, quarterly, yearly)
  const renewPlansForUser = renewPlans
    ?.filter(plan =>
      plan.currency.toLowerCase() === userDetail?.currency?.toLowerCase() &&
      plan.name.toLowerCase().includes(userDetail?.membershipLevel?.toLowerCase() || '')
    )
    ?.sort((a, b) => {
      // Sort by interval: month (1) < quarter (2) < year (3)
      const intervalOrder: { [key: string]: number } = {
        'month': 1,
        'quarter': 2,
        'year': 3
      };

      const aInterval = a.interval?.toLowerCase() || '';
      const bInterval = b.interval?.toLowerCase() || '';

      return (intervalOrder[aInterval] || 999) - (intervalOrder[bInterval] || 999);
    }) || [];

  // Filter upgrade plans for CNY users (type === 'pay', currency === 'CNY')
  const upgradePlansForUser = payPlans?.filter(plan =>
    plan.currency.toLowerCase() === 'cny' &&
    (userDetail?.membershipLevel === 'trial'
      ? plan.name.toLowerCase().includes('plus') || plan.name.toLowerCase().includes('pro')
      : plan.name.toLowerCase().includes('pro'))
  ) || [];

  const TopUpDialog = () => {
    const dialogT = useTranslations('sidebar.topUpDialog');

    return (
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{dialogT('title')}</DialogTitle>
            <DialogDescription>
              {dialogT('description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {extraPlansForUser.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No top-up packages available for your currency ({userDetail?.currency}).
              </div>
            ) : (
              extraPlansForUser.map((plan) => (
                <Button
                  key={plan.id}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleTopUp(plan)}
                  disabled={topUpPlanId !== null}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="text-left">
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${formatQuotaString(plan.quota)} quota
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t("topUpDialog.validForOneMonth")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {plan.currency.toUpperCase()} ${(plan.amount / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {dialogT('selectPlan')}
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const RenewDialog = () => {
    const dialogT = useTranslations('sidebar.renewDialog');

    return (
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{dialogT('title')}</DialogTitle>
            <DialogDescription>
              {dialogT('description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {renewPlansForUser.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No renew packages available for your membership level ({userDetail?.membershipLevel}) and currency ({userDetail?.currency}).
              </div>
            ) : (
              renewPlansForUser.map((plan) => (
                <Button
                  key={plan.id}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleRenew(plan)}
                  disabled={renewPlanId !== null}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="text-left">
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${formatQuotaString(plan.quota)} quota
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {dialogT('renewSubscription')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {plan.currency.toUpperCase()} ${(plan.amount / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {dialogT('selectPlan')}
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const UpgradeDialog = () => {
    const dialogT = useTranslations('sidebar.upgradeDialog');

    return (
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{dialogT('title')}</DialogTitle>
            <DialogDescription>
              {dialogT('description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {upgradePlansForUser.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upgrade packages available for your membership level ({userDetail?.membershipLevel}) and currency (CNY).
              </div>
            ) : (
              upgradePlansForUser.map((plan) => (
                <Button
                  key={plan.id}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleUpgrade(plan)}
                  disabled={upgradePlanId !== null}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="text-left">
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${formatQuotaString(plan.quota)} quota
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {dialogT('oneTimePayment')}
                      </div>
                    </div>
                    <div className="text-right">
                      {/* <div className="font-bold">
                        {plan.currency.toUpperCase()} ${(plan.amount / 100).toFixed(2)}
                      </div> */}
                      <div className="text-sm text-muted-foreground">
                        {dialogT('selectPlan')}
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Show loading while checking authentication or fetching data
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    const returnTo = pathname;
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    return null;
  }

  // 如果用户没有订阅，显示 tutorial
  if (!isActive) {
    return (
      <DashboardLayout
        pageTitle={dt("title")}
        hasActiveSubscription={false}
      >
        <Tutorial />
      </DashboardLayout>
    );
  }

  // console.log(usageData);
  // console.log(dailyUsageData);

  return (
    <DashboardLayout
      pageTitle={dt("title")}
      hasActiveSubscription={isActive}
    >
      <div className="max-w-6xl mx-auto flex flex-col">

        {/* UTC and Data Delay Notice */}
        <div className="text-md text-muted-foreground mb-4">
          {t("utcNotice")}
        </div>

        {/* Monthly Quota, Usage, and Upgrade Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-dashboard-card rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">{t("monthlyQuota")}</div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-foreground">${tokenStats.total}</div>
              {parseFloat(userDetail?.topUpQuota!) > 0 ? (
                <div className="ml-auto flex items-center gap-2">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-sm"></div>
                    <div className="relative inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      {t("topUpLeft", { quota: userDetail?.topUpQuota! })}
                    </div>
                    {/* Custom tooltip - appears immediately on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      {`${t("topUpExpiresOn")}: ${userDetail?.topUpExpred ? new Date(userDetail.topUpExpred).toLocaleDateString() : 'N/A'}`}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="default"
                  className="ml-auto h-8 rounded-2xl button-themed px-3 text-sm"
                  onClick={() => setShowTopUpDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t("topUp")}
                </Button>
              )}
            </div>
          </div>

          <div className="bg-dashboard-card rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">{t("subscriptionEndDate")}</div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-primary">
                {userDetail?.currentEndAt ? new Date(userDetail.currentEndAt).toLocaleDateString() : dt("noSubscription")}
              </div>
              {
                userDetail?.currency?.toUpperCase() === 'CNY' && (
                  <Button
                    variant="default"
                    className="h-8 rounded-2xl button-themed px-3 text-sm cursor-pointer"
                    onClick={handleRenewClick}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t("renew")}
                  </Button>
                )}
            </div>
          </div>

          <div className="bg-dashboard-card rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">{t("membershipLevel")}</div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-primary capitalize">
                {membershipLevel}
              </div>
              {membershipLevel !== 'pro' && (
                <Button
                  variant="default"
                  className="h-10 rounded-2xl button-themed px-4 cursor-pointer"
                  onClick={handleUpgradePlan}
                >
                  {/* <ArrowUp className="h-4 w-4 mr-2" /> */}
                  {t("upgradePlan")}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-4 mb-6 mr-8">
          <div className="bg-dashboard-card rounded-lg p-4 flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">{t("currentUsage")}</h3>
            </div>
            <div className="text-3xl font-bold text-foreground">
              ${tokenStats.used}
            </div>
            <div className="text-xs text-muted-foreground">{usagePercentage.toFixed(1)}% {t("ofQuota")}</div>
          </div>

          <div className="bg-dashboard-card rounded-lg p-4 w-48">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">{t("month")}</h3>
            </div>
            <MonthPicker
              selected={selectedMonth}
              onChange={handleMonthChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>
        </div>
        {/* Daily Usage Chart */}
        <div className="bg-dashboard-card rounded-lg p-4">
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("dailyTokenUsage")}</h3>
          {loadingDailyUsage ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
              <div className="text-muted-foreground">Loading daily usage data...</div>
            </div>
          ) : dailyUsageData.length > 0 ? (
            <DailyUsageChart data={dailyUsageData} selectedMonth={selectedMonth.toISOString().slice(0, 7)} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">{dt("noUsageData")}</div>
            </div>
          )}
        </div>
      </div>

      <TopUpDialog />
      <RenewDialog />
      <UpgradeDialog />
    </DashboardLayout>
  );
}