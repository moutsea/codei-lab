"use client";

import { useTranslations } from "next-intl";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Key, LayoutDashboard, CreditCard, User } from "lucide-react";
import { useState } from "react";
import { usePlans } from "@/hooks/usePlans";
import { UserDetail } from "@/hooks/useUserData";
// import { NonRecurringPaymentDialog } from "@/components/non-recurring-payment-dialog";

interface DashboardSidebarProps {
  hasActiveSubscription?: boolean;
  stripeCustomerId?: string;
  userDetail?: UserDetail | null;
  isActive?: boolean;
}

export function DashboardSidebar({ hasActiveSubscription, stripeCustomerId, userDetail, isActive }: DashboardSidebarProps) {
  const t = useTranslations("sidebar");
  const [showNonRecurringDialog, setShowNonRecurringDialog] = useState(false);

  const {
    extraPlans,
    isLoading: plansLoading,
  } = usePlans();

  const handleBillingClick = async (event: React.MouseEvent) => {
    event.preventDefault();

    // Wait for user data to be loaded before making decisions
    if (!userDetail || isActive === undefined) {
      console.log('User data still loading, please wait...');
      return;
    }

    // Check if user has an active one-payment plan (no subscription ID)
    if (isActive && !userDetail?.stripeSubscriptionId) {
      console.log('User has active one-payment plan, opening non-recurring dialog');
      setShowNonRecurringDialog(true);
      return;
    }

    if (stripeCustomerId) {
      const response = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stripeCustomerId }),
      });

      // 如果响应不是成功的状态码（200），抛出错误
      if (!response.ok) {
        throw new Error(`Failed to fetch billing URL, status: ${response.status}`);
      }

      const data = await response.json();

      if (data.billingUrl) {
        window.location.assign(data.billingUrl);  // 成功获取到 URL 后跳转
      } else {
        console.error('Failed to get billing URL:', data.error);
      }
    }
  }

  // Navigation item type
  interface NavigationItem {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    onClick?: (event: React.MouseEvent) => void;
    external?: boolean;
  }

  // Sidebar navigation items - only show dashboard if user is not subscribed
  const navigationItems: NavigationItem[] = hasActiveSubscription ? [
    {
      title: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: t("apiKeys"),
      icon: Key,
      href: "/dashboard/api-keys",
    },
    {
      title: t("billing"),
      icon: CreditCard,
      href: "",
      onClick: handleBillingClick,
      external: true,
    },
    {
      title: t("profile"),
      icon: User,
      href: "/dashboard/profile",
    },
  ] : [
    {
      title: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
    },
  ];

  return (
    <Sidebar className="pt-16 [&>div]:bg-card dark:bg-[#212121] border-r border-border pl-6 overflow-x-hidden">
      <SidebarContent className="overflow-y-auto overflow-x-hidden bg-card dark:bg-[#212121] ">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm mb-10 ml-6 text-foreground">{t("navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="ml-6">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.href}
                      {...(item.external && {
                        target: "_blank",
                        rel: "noopener noreferrer"
                      })}
                      onClick={item.onClick}
                    >
                      <item.icon className="text-muted-foreground" />
                      <span className="text-foreground">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* <NonRecurringPaymentDialog
        open={showNonRecurringDialog}
        onOpenChange={setShowNonRecurringDialog}
        plans={extraPlans}
        loading={plansLoading.extra}
        hideTrigger={true}
      /> */}
    </Sidebar>
  );
}
