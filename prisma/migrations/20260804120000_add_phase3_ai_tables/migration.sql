-- CreateEnum
CREATE TYPE "ai_tool_invocation_status" AS ENUM ('success', 'failed', 'timeout');

-- CreateTable
CREATE TABLE "ai_memory_facts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT,
    "fact_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source_run_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "ai_memory_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tool_invocations" (
    "id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "agent_run_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ai_tool_invocation_status" NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_tool_invocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_memory_facts_user_id_scope_type_scope_id_idx" ON "ai_memory_facts"("user_id", "scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "ai_memory_facts_user_id_fact_type_idx" ON "ai_memory_facts"("user_id", "fact_type");

-- CreateIndex
CREATE INDEX "ai_tool_invocations_agent_run_id_idx" ON "ai_tool_invocations"("agent_run_id");

-- CreateIndex
CREATE INDEX "ai_tool_invocations_user_id_created_at_idx" ON "ai_tool_invocations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_tool_invocations_tool_id_created_at_idx" ON "ai_tool_invocations"("tool_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_memory_facts" ADD CONSTRAINT "ai_memory_facts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tool_invocations" ADD CONSTRAINT "ai_tool_invocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
