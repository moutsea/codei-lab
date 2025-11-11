ALTER TABLE "email_login_tokens" ADD COLUMN "consumed_at" timestamp;
CREATE INDEX IF NOT EXISTS "email_login_tokens_consumed_at_idx" ON "email_login_tokens" ("consumed_at");
