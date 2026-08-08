-- CreateEnum
CREATE TYPE "ai_agent_run_status" AS ENUM ('running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "ai_agent_runs" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ai_agent_run_status" NOT NULL DEFAULT 'running',
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "embedding_tokens" INTEGER DEFAULT 0,
    "estimated_cost_usd" DECIMAL(12,6),
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "prompt_version" TEXT,
    "latency_ms" INTEGER,
    "langsmith_run_id" TEXT,
    "correlation_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_daily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "user_id" TEXT,
    "agent_id" TEXT,
    "total_runs" INTEGER NOT NULL DEFAULT 0,
    "total_input_tokens" BIGINT NOT NULL DEFAULT 0,
    "total_output_tokens" BIGINT NOT NULL DEFAULT 0,
    "total_cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_usage_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_agent_runs_user_id_created_at_idx" ON "ai_agent_runs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_agent_runs_agent_id_created_at_idx" ON "ai_agent_runs"("agent_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_daily_date_user_id_agent_id_idx" ON "ai_usage_daily"("date", "user_id", "agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_usage_daily_date_user_id_agent_id_key" ON "ai_usage_daily"("date", "user_id", "agent_id");

-- AddForeignKey
ALTER TABLE "ai_agent_runs" ADD CONSTRAINT "ai_agent_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_daily" ADD CONSTRAINT "ai_usage_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
