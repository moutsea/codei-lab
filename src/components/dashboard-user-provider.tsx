"use client";

import { createContext, useContext, ReactNode } from "react";
import { useUserData } from "@/hooks/useUserData";

type DashboardUserContextValue = ReturnType<typeof useUserData>;

const DashboardUserContext = createContext<DashboardUserContextValue | null>(null);

interface DashboardUserProviderProps {
  children: ReactNode;
}

export function DashboardUserProvider({ children }: DashboardUserProviderProps) {
  const userData = useUserData({ enableCache: true });

  return (
    <DashboardUserContext.Provider value={userData}>
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUser() {
  const context = useContext(DashboardUserContext);
  if (!context) {
    throw new Error("useDashboardUser must be used within a DashboardUserProvider");
  }
  return context;
}


