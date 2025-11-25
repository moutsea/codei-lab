import type { UserSelect } from '@/types/schema';

export interface AdminServiceError {
  success: false;
  error: string;
  status: number;
}

export interface AdminAuthSuccess {
  success: true;
  user: UserSelect;
}

export interface AdminStatsSuccess {
  success: true;
  data: {
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
      inputTokens: number;
      cachedTokens: number;
      outputTokens: number;
    };
    quota: {
      used: string;
    };
    subscriptions: {
      active: number;
      total: number;
      monthlySubscriptions: number;
    };
  };
}

export type AdminAuthResult = AdminServiceError | AdminAuthSuccess;
export type AdminStatsResult = AdminServiceError | AdminStatsSuccess;