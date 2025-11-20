/**
 * Monthly API usage with additional API key information
 */
export interface MonthlyApiUsageWithName {
  apikey: string | null;
  month: string | null;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  quotaUsed: string;
  updatedAt: Date | null;
  apiKeyId: number;
  apiKeyName: string;
  quotaLimit: string | null;
}

// Import necessary types from schema
import type { ApiKeySelect } from "@/types";

/**
 * Monthly metrics data for analytics and reporting
 */
export interface MonthlyMetricsData {
  month: string;
  users: number;
  revenue: number;
  revenueByCurrency: {
    [currency: string]: {
      amount: number;
      currency: string;
    };
  };
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  totalTokens: number;
  subscriptions: number;
}

/**
 * User detail information with subscription and usage data
 */
export interface UserDetail {
  userId: string;
  name?: string | null;
  email?: string | null;
  stripeSubscriptionId?: string; // from subscription
  stripeCustomerId: string;
  startDate?: Date | null;
  planId?: string; // from plan
  membershipLevel?: string; // from plan
  active?: boolean; // from subscription
  currentEndAt?: Date | null; // from subscription
  quota: string; // from plan
  topUpQuota?: string | null;
  topUpExpred?: Date | null;
  quotaMonthlyUsed?: string; // from monthly-user-usage table (quotaUsed field)
  currency: string;
}

/**
 * API key with current month usage information
 */
export interface ApiKeyWithUsage extends Omit<ApiKeySelect, never> {
  currentMonthUsage: number;
}