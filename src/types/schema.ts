// Schema type definitions inferred from database tables
// These types provide type safety for database operations

import {
    users,
    plans,
    subscriptions,
    payments,
    apiKeys,
    dailyUserUsage,
    monthlyApiUsage,
    monthlyUserUsage,
    emailLoginTokens,
} from '@/db/schema';

// Infer types from table definitions for type safety
export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export type PlanSelect = typeof plans.$inferSelect;
export type PlanInsert = typeof plans.$inferInsert;

export type SubscriptionSelect = typeof subscriptions.$inferSelect;
export type SubscriptionInsert = typeof subscriptions.$inferInsert;

export type PaymentSelect = typeof payments.$inferSelect;
export type PaymentInsert = typeof payments.$inferInsert;

export type ApiKeySelect = typeof apiKeys.$inferSelect;
export type ApiKeyInsert = typeof apiKeys.$inferInsert;

export type DailyUserUsageSelect = typeof dailyUserUsage.$inferSelect;
export type DailyUserUsageInsert = typeof dailyUserUsage.$inferInsert;

export type MonthlyApiUsageSelect = typeof monthlyApiUsage.$inferSelect;
export type MonthlyApiUsageInsert = typeof monthlyApiUsage.$inferInsert;

export type MonthlyUserUsageSelect = typeof monthlyUserUsage.$inferSelect;
export type MonthlyUserUsageInsert = typeof monthlyUserUsage.$inferInsert;

export type EmailLoginTokenSelect = typeof emailLoginTokens.$inferSelect;
export type EmailLoginTokenInsert = typeof emailLoginTokens.$inferInsert;

// Export table types for direct reference
export type UsersTable = typeof users;
export type PlansTable = typeof plans;
export type SubscriptionsTable = typeof subscriptions;
export type PaymentsTable = typeof payments;
export type ApiKeysTable = typeof apiKeys;
export type DailyUserUsageTable = typeof dailyUserUsage;
export type MonthlyApiUsageTable = typeof monthlyApiUsage;
export type MonthlyUserUsageTable = typeof monthlyUserUsage;
export type EmailLoginTokensTable = typeof emailLoginTokens;

// Common utility types
export type UserId = UserSelect['id'];
export type PlanId = PlanSelect['id'];
export type SubscriptionId = SubscriptionSelect['id'];
export type PaymentId = PaymentSelect['id'];
export type ApiKeyId = ApiKeySelect['id'];
export type DailyUserUsageId = DailyUserUsageSelect['id'];
export type MonthlyApiUsageId = MonthlyApiUsageSelect['id'];
export type MonthlyUserUsageId = MonthlyUserUsageSelect['id'];
