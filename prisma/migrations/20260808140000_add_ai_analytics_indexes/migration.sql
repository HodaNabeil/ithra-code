-- Analytics dashboard + observability query paths
CREATE INDEX "ai_agent_runs_created_at_idx" ON "ai_agent_runs"("created_at" DESC);
CREATE INDEX "ai_agent_runs_status_created_at_idx" ON "ai_agent_runs"("status", "created_at" DESC);
CREATE INDEX "ai_agent_runs_status_completed_at_idx" ON "ai_agent_runs"("status", "completed_at" DESC);
CREATE INDEX "ai_agent_runs_provider_created_at_idx" ON "ai_agent_runs"("provider", "created_at" DESC);
CREATE INDEX "ai_agent_runs_model_created_at_idx" ON "ai_agent_runs"("model", "created_at" DESC);
CREATE INDEX "ai_usage_daily_date_idx" ON "ai_usage_daily"("date" DESC);
CREATE INDEX "ai_usage_daily_agent_id_date_idx" ON "ai_usage_daily"("agent_id", "date" DESC);
