"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowUp, Calendar, BarChart3 } from "lucide-react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DailyUsageChart } from "@/components/ui/daily-usage-chart";
import { MonthPicker } from "@/components/ui/month-picker";
import Tutorial from "@/components/tutorial/tutorial";
import { useUserData } from "@/hooks/useUserData";
import { usePlans } from "@/hooks/usePlans";
import { NonRecurringPaymentDialog } from "@/components/non-recurring-payment-dialog";

interface TokenStats {
  total: number;
  used: number;
}

interface DailyUsage {
  date: string;
  tokens: number;
}

interface DailyUsageItem {
  date: string;
  totalTokens: number;
}


export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const {
    userDetail,
    usageData,
    isActive,
    requestLimit,

    loading
  } = useUserData({ enableCache: true });

  const {
    extraPlans,
    isLoading: plansLoading,
  } = usePlans();

  const [dailyUsageData, setDailyUsageData] = useState<DailyUsage[]>([]);
  const [loadingDailyUsage, setLoadingDailyUsage] = useState(false);

  const t = useTranslations("sidebar");
  const dt = useTranslations("dashboard");

  // Hook automatically fetches data when user is authenticated

  // All state hooks must be declared before any conditional returns
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    total: 50000000, // 默认值50M，会被实际计划值覆盖
    used: 0
  });

  // 当使用数据加载完成后更新token统计
  useEffect(() => {
    if (usageData && requestLimit !== undefined) {
      // 使用新的 usage data结构
      const used = usageData.totalTokens || 0;
      const total = requestLimit || 50000000;
      console.log(`Using requestLimit: ${total}, tokens used: ${used}, usagePercentage: ${total > 0 ? (used / total) * 100 : 0}%`);
      setTokenStats({
        total,
        used
      });
    }
  }, [usageData, requestLimit]);

  const [selectedMonth, setSelectedMonth] = useState(new Date()); // Date object for react-datepicker
  const [showNonRecurringDialog, setShowNonRecurringDialog] = useState(false);

  // 获取特定月份的每日使用数据
  const fetchDailyUsageData = useCallback(async (date: Date) => {
    if (!user?.id) return;

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

      const response = await fetch(
        `/api/user/${user.id}/usage?startDate=${formatLocalDate(startDate)}&endDate=${formatLocalDate(endDate)}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched daily usage for ${year}-${month.toString().padStart(2, '0')}:`, data.usage);

        // 转换数据格式以匹配 DailyUsage 接口
        const formattedData: DailyUsage[] = data.usage?.dailyUsage?.map((item: DailyUsageItem) => ({
          date: item.date,
          tokens: item.totalTokens
        })) || [];

        setDailyUsageData(formattedData);
      } else {
        console.error('Failed to fetch daily usage data');
        setDailyUsageData([]);
      }
    } catch (error) {
      console.error('Error fetching daily usage data:', error);
      setDailyUsageData([]);
    } finally {
      setLoadingDailyUsage(false);
    }
  }, [user?.id]);

  // 当选择的月份变化时，获取对应的每日使用数据
  useEffect(() => {
    if (user?.id && isActive) {
      fetchDailyUsageData(selectedMonth);
    }
  }, [selectedMonth, user?.id, isActive, fetchDailyUsageData]);

  const formatTokens = (tokens: number | undefined) => {
    if (typeof tokens !== 'number' || isNaN(tokens)) {
      return '0';
    }
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const usagePercentage = (typeof tokenStats.total === 'number' && tokenStats.total > 0 && typeof tokenStats.used === 'number')
    ? (tokenStats.used / tokenStats.total) * 100
    : 0;

  const handleMonthChange = (date: Date | null) => {
    if (date) {
      setSelectedMonth(date);
    }
  };

  const handleUpgradePlan = async () => {
    // Wait for user data to be loaded before making decisions
    if (isLoading || loading || !userDetail) {
      console.log('User data still loading, please wait...');
      return;
    }

    // Check if user has an active one-payment plan (no subscription ID)
    if (isActive && !userDetail?.stripeSubscriptionId) {
      console.log('User has active one-payment plan, opening non-recurring dialog');
      setShowNonRecurringDialog(true);
      return;
    }

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
    const returnTo = window.location.pathname;
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    return null;
  }

  // 如果用户没有订阅，显示 tutorial
  if (!isActive) {
    return (
      <DashboardLayout
        pageTitle={dt("title")}
        hasActiveSubscription={false}
        stripeCustomerId={userDetail?.stripeCustomerId} // TODO: Update when available in UserDetail
      >
        <Tutorial />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle={dt("title")}
      hasActiveSubscription={isActive}
      stripeCustomerId={userDetail?.stripeCustomerId} // TODO: Update when available in UserDetail
    >
      <div className="max-w-6xl mx-auto flex flex-col">

        {/* UTC and Data Delay Notice */}
        <div className="text-md text-muted-foreground mb-4">
          {t("utcNotice")}
        </div>

        {/* Monthly Quota, Usage, and Upgrade Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="text-sm text-muted-foreground mb-1">{t("monthlyQuota")}</div>
            <div className="text-2xl font-bold text-foreground">{formatTokens(tokenStats.total)}</div>
          </div>

          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="text-sm text-muted-foreground mb-1">{t("currentUsage")}</div>
            <div className="text-2xl font-bold text-primary">{formatTokens(tokenStats.used)}</div>
            <div className="text-xs text-muted-foreground">{usagePercentage.toFixed(1)}% {t("ofQuota")}</div>
          </div>

          <Button
            variant="default"
            className="w-48 mr-8 h-16 rounded-3xl button-themed"
            onClick={handleUpgradePlan}
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            {t("upgradePlan")}
          </Button>
        </div>

        {/* Daily Usage and Month Selection */}
        <div className="flex justify-between gap-4 mb-6 mr-8">
          <div className="bg-card rounded-lg p-4 flex-1 border border-border">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">{t("dailyUsage")}</h3>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {formatTokens(Math.floor(tokenStats.used / 30))}
            </div>
            <div className="text-sm text-muted-foreground">{t("averageDailyTokens")}</div>
          </div>

          <div className="bg-card rounded-lg p-4 w-48 border border-border">
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
        <div className="bg-card rounded-lg p-4 border border-border">
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

      <NonRecurringPaymentDialog
        open={showNonRecurringDialog}
        onOpenChange={setShowNonRecurringDialog}
        plans={extraPlans}
        loading={plansLoading.extra}
        hideTrigger={true}
      />
    </DashboardLayout>
  );
}