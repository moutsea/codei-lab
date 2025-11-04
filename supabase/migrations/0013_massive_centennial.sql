ALTER TABLE "daily_user_usage" RENAME COLUMN "month" TO "date";--> statement-breakpoint
ALTER TABLE "daily_user_usage" DROP CONSTRAINT "unique_user_date";--> statement-breakpoint
ALTER TABLE "daily_user_usage" ADD CONSTRAINT "unique_user_date" UNIQUE("user_id","date");