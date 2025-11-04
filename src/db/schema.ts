import {
    pgTable,
    varchar,
    text,
    boolean,
    integer,
    timestamp,
    numeric,
    jsonb,
    unique,
} from "drizzle-orm/pg-core";

// ========== Users ==========
export const users = pgTable(
    "users",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        auth0UserId: text("auth0_user_id").notNull().unique(), // auth0|xxxxxx
        email: varchar("email", { length: 255 }).notNull(),
        nickname: varchar("nickname", { length: 255 }),
        avatarUrl: text("avatar_url"),
        stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
        isAdmin: boolean("is_admin").notNull().default(false),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
);

// ========== Plans ==========
export const plans = pgTable("plans", {
    id: text("id").primaryKey().notNull(),
    membershipLevel: varchar("membership_level", { length: 50 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    stripeProductId: varchar("stripe_product_id", { length: 255 }),
    stripePriceId: varchar("stripe_price_id", { length: 255 }).unique(),
    amount: integer("amount").notNull(), // 单位: 分
    currency: varchar("currency", { length: 10 }).default("USD"),
    isRecurring: boolean("is_recurring").default(true),
    interval: text("interval").notNull(), // 'day' | 'week' | 'month' | 'quarter' | 'year'
    requestLimit: integer("request_limit").notNull(),
    modelAccess: jsonb("model_access").notNull().default("[]"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ========== Subscriptions ==========
export const subscriptions = pgTable("subscriptions", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    // 关联
    userId: integer("user_id").references(() => users.id),
    planId: text("plan_id").references(() => plans.id),

    // 状态
    status: varchar("status", { length: 50 }).notNull(),
    // active, trialing, canceled, incomplete, past_due, unpaid

    // 时间字段
    startDate: timestamp("start_date", { withTimezone: true }).defaultNow(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull(),
    cancelAt: timestamp("cancel_at", { withTimezone: true }),
    renewsAt: timestamp("renews_at", { withTimezone: true }),

    // Stripe 相关
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }), // sub_XXXX
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),         // cus_XXXX

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ========== Payments ==========
export const payments = pgTable("payments", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    // 关联
    userId: integer("user_id").references(() => users.id),
    subscriptionId: varchar("subscription_id", { length: 255 }),

    // Stripe 支付对象
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }), // pi_XXXX

    // 金额信息
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("USD"),

    // 状态
    status: varchar("status", { length: 50 }),
    // requires_payment_method, requires_confirmation, succeeded, failed, refunded

    // 通用
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ========== API Keys ==========
export const apiKeys = pgTable("api_keys", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    key: varchar("key", { length: 255 }).notNull().unique(),
    requestLimit: integer("request_limit"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiredAt: timestamp("expiredAt", { withTimezone: true })
});

export const dailyUserUsage = pgTable(
    "daily_user_usage",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        userId: integer("user_id").references(() => users.id),
        date: varchar("date", { length: 30 }),
        totalTokens: integer("total_tokens").notNull().default(0),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        unique("unique_user_date").on(table.userId, table.date),
    ]
);

export const monthlyApiUsage = pgTable(
    "monthly_api_usage",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        apikey: varchar("api_key", { length: 255 }).references(() => apiKeys.key),
        month: varchar("month", { length: 30 }),
        totalTokens: integer("total_tokens").notNull().default(0),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        unique("unique_api_date").on(table.apikey, table.month),
    ]
);

export const monthlyUserUsage = pgTable(
    "monthly_user_usage",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        userId: integer("user_id").references(() => users.id),
        month: varchar("month", { length: 30 }),
        totalTokens: integer("total_tokens").notNull().default(0),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        unique("unique_user_month").on(table.userId, table.month),
    ]
);

// ========== Type Exports ==========
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

// Export table types for direct reference
export type UsersTable = typeof users;
export type PlansTable = typeof plans;
export type SubscriptionsTable = typeof subscriptions;
export type PaymentsTable = typeof payments;
export type ApiKeysTable = typeof apiKeys;
export type DailyUserUsageTable = typeof dailyUserUsage;
export type MonthlyApiUsageTable = typeof monthlyApiUsage;
export type MonthlyUserUsageTable = typeof monthlyUserUsage;

// Common utility types
export type UserId = UserSelect['id'];
export type PlanId = PlanSelect['id'];
export type SubscriptionId = SubscriptionSelect['id'];
export type PaymentId = PaymentSelect['id'];
export type ApiKeyId = ApiKeySelect['id'];
export type DailyUserUsageId = DailyUserUsageSelect['id'];
export type MonthlyApiUsageId = MonthlyApiUsageSelect['id'];
export type MonthlyUserUsageId = MonthlyUserUsageSelect['id'];

