const ALLOWED_LABEL_KEYS: Record<string, readonly string[]> = {
  ai_agent_runs_total: ['agent_id', 'status'],
  ai_requests_total: ['agent_id', 'status'],
  ai_agent_run_duration_ms: ['agent_id'],
  ai_request_duration_ms: ['agent_id'],
  ai_llm_tokens_total: ['model', 'provider', 'direction'],
  ai_tokens_input_total: ['model', 'provider'],
  ai_tokens_output_total: ['model', 'provider'],
  ai_embedding_tokens_total: ['model'],
  ai_cost_usd_total: ['model', 'provider', 'agent_id'],
  ai_request_errors_total: ['agent_id', 'error_code'],
  ai_tool_invocations_total: ['tool_id', 'status'],
  ai_retrieval_chunks_total: ['agent_id'],
  ai_retrieval_latency_ms: ['agent_id'],
  ai_rag_retrieval_duration_ms: ['agent_id'],
  ai_budget_reservation_rejected_total: ['reason'],
  ai_rate_limit_rejected_total: ['scope'],
  ai_auth_failure_total: ['reason'],
  ai_stream_abort_total: ['agent_id'],
  ai_redis_guard_failure_total: ['guard'],
};

const FORBIDDEN_LABEL_KEYS = new Set([
  'user_id',
  'userid',
  'course_id',
  'courseid',
  'thread_id',
  'threadid',
  'prompt',
  'response',
  'content',
]);

export function sanitizeMetricLabels(
  metricName: string,
  labels: Record<string, string>,
): Record<string, string> {
  const allowedKeys = ALLOWED_LABEL_KEYS[metricName];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(labels)) {
    const normalized = key.toLowerCase();
    if (FORBIDDEN_LABEL_KEYS.has(normalized)) {
      continue;
    }

    if (allowedKeys && !allowedKeys.includes(key)) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

export function listAllowedMetricLabelKeys(
  metricName: string,
): readonly string[] {
  return ALLOWED_LABEL_KEYS[metricName] ?? [];
}
