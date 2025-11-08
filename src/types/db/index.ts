// API Key detail interface
export interface ApiDetail {
    userId: string | null;
    apiMonthlyUsed: number;
    quota: string | null;
    quotaUsed: string;
    month: string | null;
    expiredAt: Date | null;
}

// Re-export all database type definitions
export type { MonthlyApiUsageWithName, MonthlyMetricsData, UserDetail, ApiKeyWithUsage } from './monthly-usage';