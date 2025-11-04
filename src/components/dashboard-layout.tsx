"use client";

import { ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { useUserData } from "@/hooks/useUserData";

interface DashboardLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  hasActiveSubscription?: boolean;
  stripeCustomerId?: string;
}

export function DashboardLayout({
  children,
  pageTitle,
  pageSubtitle,
  hasActiveSubscription,
  stripeCustomerId
}: DashboardLayoutProps) {
  const { userDetail, isActive } = useUserData({ enableCache: true });

  // const { user } = useUser();
  // createOrUpdateUserProfile(user!);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <SidebarProvider className="h-full min-h-0">
        <DashboardSidebar
          hasActiveSubscription={hasActiveSubscription}
          stripeCustomerId={stripeCustomerId}
          userDetail={userDetail}
          isActive={isActive}
        />
        <SidebarInset>
          <header className="flex h-16 bg-[#fbfaf7] shrink-0 items-center gap-2 transition-[width,height] ease-linear group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <h1 className="text-lg font-semibold">
                {pageTitle}
              </h1>
            </div>
          </header>
          <main className="flex-1 bg-[#fbfaf7] p-6">
            {pageSubtitle && (
              <div className="mb-6">
                <p className="text-muted-foreground">
                  {pageSubtitle}
                </p>
              </div>
            )}
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}