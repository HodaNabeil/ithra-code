-- AlterTable
ALTER TABLE "ai_agent_runs" ADD COLUMN IF NOT EXISTS "token_usage_estimated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_agent_runs" ADD COLUMN IF NOT EXISTS "actual_model" TEXT;
ALTER TABLE "ai_agent_runs" ADD COLUMN IF NOT EXISTS "actual_provider" TEXT;
