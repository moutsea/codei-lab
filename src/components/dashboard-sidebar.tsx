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
import { Key, LayoutDashboard, User, Settings } from "lucide-react";

interface DashboardSidebarProps {
  hasActiveSubscription?: boolean;
}

export function DashboardSidebar({ hasActiveSubscription }: DashboardSidebarProps) {
  const t = useTranslations("sidebar");

  // Navigation item type
  interface NavigationItem {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
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
    <Sidebar className="pt-16 [&>div]:bg-card dark:bg-[#212121] border-r border-border overflow-x-hidden">
      <SidebarContent className="overflow-y-auto overflow-x-hidden bg-card dark:bg-[#212121]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm mb-8 ml-6 text-foreground font-semibold">
            {t("navigation")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="ml-4 space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className="h-12 w-[calc(100%-2rem)] mx-4 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                  >
                    <a href={item.href} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SidebarContent>
    </Sidebar>
  );
}
