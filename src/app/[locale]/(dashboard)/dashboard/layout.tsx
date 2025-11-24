import { ReactNode } from "react";
import { DashboardUserProvider } from "@/components/dashboard-user-provider";

export default function DashboardSectionLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardUserProvider>
      {children}
    </DashboardUserProvider>
  );
}


