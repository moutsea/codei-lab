CREATE TABLE "api_keys" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "api_keys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(100),
	"name" varchar(255) NOT NULL,
	"key" varchar(255) NOT NULL,
	"quota" numeric(10, 4),
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp,
	"expiredAt" timestamp,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "daily_user_usage" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "daily_user_usage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(100),
	"date" varchar(30),
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"cached_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"quota_used" numeric(10, 4) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_date" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "monthly_api_usage" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "monthly_api_usage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"api_key" varchar(255),
	"month" varchar(30),
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"cached_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"quota_used" numeric(10, 4) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_api_date" UNIQUE("api_key","month")
);
--> statement-breakpoint
CREATE TABLE "monthly_user_usage" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "monthly_user_usage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(100),
	"month" varchar(30),
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"cached_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"quota_used" numeric(10, 4) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_month" UNIQUE("user_id","month")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(100),
	"subscription_id" varchar(255),
	"stripe_payment_intent_id" varchar(255),
	"amount" numeric(10, 4) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"status" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"membership_level" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"stripe_product_id" varchar(255),
	"stripe_price_id" varchar(255),
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"is_recurring" boolean DEFAULT true,
	"interval" text NOT NULL,
	"quota" numeric(10, 4) NOT NULL,
	"type" varchar(50),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "plans_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(100),
	"plan_id" text,
	"status" varchar(50) NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean NOT NULL,
	"cancel_at" timestamp,
	"renews_at" timestamp,
	"stripe_subscription_id" varchar(255),
	"stripe_customer_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topup_purchases" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "topup_purchases_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(100),
	"start_date" timestamp DEFAULT now(),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"end_date" timestamp,
	"quota" numeric(10, 4) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"nickname" varchar(255),
	"avatar_url" text,
	"stripe_customer_id" varchar(255),
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_user_usage" ADD CONSTRAINT "daily_user_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_api_usage" ADD CONSTRAINT "monthly_api_usage_api_key_api_keys_key_fk" FOREIGN KEY ("api_key") REFERENCES "public"."api_keys"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_user_usage" ADD CONSTRAINT "monthly_user_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topup_purchases" ADD CONSTRAINT "topup_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;