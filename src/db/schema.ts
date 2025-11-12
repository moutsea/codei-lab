import {
    pgTable,
    varchar,
    text,
    boolean,
    integer,
    timestamp,
    numeric,
    unique,
} from "drizzle-orm/pg-core";

// ========== Users ==========
export const users = pgTable(
    "users",
    {
        id: varchar("id", { length: 100 }).primaryKey(),
        email: varchar("email", { length: 255 }).notNull().unique(),
        nickname: varchar("nickname", { length: 255 }),
        avatarUrl: text("avatar_url"),
        stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
        isAdmin: boolean("is_admin").notNull().default(false),
        createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
    },
);

// ========== Plans ==========
export const plans = pgTable("plans", {
    id: text("id").primaryKey().notNull(),
    membershipLevel: varchar("membership_level", { length: 50 }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    stripeProductId: varchar("stripe_product_id", { length: 255 }),
    stripePriceId: varchar("stripe_price_id", { length: 255 }).unique(),
    amount: integer("amount").notNull(), // 单位: 分
    currency: varchar("currency", { length: 10 }).default("USD"),
    isRecurring: boolean("is_recurring").default(true),
    interval: text("interval").notNull(), // 'day' | 'week' | 'month' | 'quarter' | 'year'
    quota: numeric("quota", { precision: 10, scale: 4 }).notNull(),
    type: varchar("type", { length: 50 }), // renew | extra | sub | pay
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
});

// ========== Subscriptions ==========
export const subscriptions = pgTable("subscriptions", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    // 关联
    userId: varchar("user_id", { length: 100 }).references(() => users.id),
    planId: text("plan_id").references(() => plans.id),

    // 状态
    status: varchar("status", { length: 50 }).notNull(),
    // active, trialing, canceled, incomplete, past_due, unpaid
    // 时间字段
    startDate: timestamp("start_date", { withTimezone: false }).defaultNow(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: false }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull(),
    cancelAt: timestamp("cancel_at", { withTimezone: false }),
    renewsAt: timestamp("renews_at", { withTimezone: false }),

    // Stripe 相关
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }), // sub_XXXX
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),         // cus_XXXX

    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
});

export const topUpPurchases = pgTable("topup_purchases", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar("user_id", { length: 100 }).references(() => users.id),
    startDate: timestamp("start_date", { withTimezone: false }).defaultNow(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    endDate: timestamp("end_date", { withTimezone: false }),
    quota: numeric("quota", { precision: 10, scale: 4 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
});

// ========== Payments ==========
export const payments = pgTable("payments", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    // 关联
    userId: varchar("user_id", { length: 100 }).references(() => users.id),
    subscriptionId: varchar("subscription_id", { length: 255 }),
    topupPurchaseId: varchar("topup_purchase_id", { length: 255 }),

    // Stripe 支付对象
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }), // pi_XXXX

    // 金额信息
    amount: numeric("amount", { precision: 10, scale: 4 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("USD"),

    // 状态
    status: varchar("status", { length: 50 }),

    type: varchar("type", { length: 50 }), // renew, sub, pay, extra
    // 通用
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
});

// ========== API Keys ==========
export const apiKeys = pgTable("api_keys", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar("user_id", { length: 100 }).references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    key: varchar("key", { length: 255 }).notNull().unique(),
    quota: numeric("quota", { precision: 10, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: false }),
    expiredAt: timestamp("expiredAt", { withTimezone: false })
});

export const dailyUserUsage = pgTable(
    "daily_user_usage",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        userId: varchar("user_id", { length: 100 }).references(() => users.id),
        date: varchar("date", { length: 30 }),
        inputTokens: integer("input_tokens").notNull().default(0),
        cachedTokens: integer("cached_tokens").notNull().default(0),
        outputTokens: integer("output_tokens").notNull().default(0),
        quotaUsed: numeric("quota_used", { precision: 10, scale: 4 }).notNull().default("0"),
        updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
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
        inputTokens: integer("input_tokens").notNull().default(0),
        cachedTokens: integer("cached_tokens").notNull().default(0),
        outputTokens: integer("output_tokens").notNull().default(0),
        quotaUsed: numeric("quota_used", { precision: 10, scale: 4 }).notNull().default("0"),
        updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
    },
    (table) => [
        unique("unique_api_date").on(table.apikey, table.month),
    ]
);

export const monthlyUserUsage = pgTable(
    "monthly_user_usage",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        userId: varchar("user_id", { length: 100 }).references(() => users.id),
        month: varchar("month", { length: 30 }),
        inputTokens: integer("input_tokens").notNull().default(0),
        cachedTokens: integer("cached_tokens").notNull().default(0),
        outputTokens: integer("output_tokens").notNull().default(0),
        quotaUsed: numeric("quota_used", { precision: 10, scale: 4 }).notNull().default("0"),
        updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
    },
    (table) => [
        unique("unique_user_month").on(table.userId, table.month),
    ]
);

export const emailLoginTokens = pgTable("email_login_tokens", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
    locale: varchar("locale", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: false }),
});
