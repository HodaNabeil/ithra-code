-- AlterTable
ALTER TABLE "ai_usage_daily" ADD COLUMN "breakdowns" JSONB;

-- CreateTable
CREATE TABLE "ai_evaluation_runs" (
    "id" TEXT NOT NULL,
    "dataset_name" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "thresholds" JSONB NOT NULL,
    "report_path" TEXT,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_evaluation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_evaluation_runs_agent_id_created_at_idx" ON "ai_evaluation_runs"("agent_id", "created_at");
