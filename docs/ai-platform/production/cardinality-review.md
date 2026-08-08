# Metric Cardinality Review — AI Platform Observability

> **Status:** Reviewed August 2026 (Phase 8)  
> **Scope:** OTEL metrics emitted by `platform-metrics.ts`

## Policy

Never label metrics by high-cardinality or PII-bearing dimensions:

- `userId`, `courseId`, `threadId`, `prompt`, `response`, RAG chunk IDs

Allowed dimensions are enforced in code via `metric-labels.ts` (`sanitizeMetricLabels`).

## Metric allowlist

| Metric | Allowed labels | Cardinality notes |
|--------|----------------|-------------------|
| `ai_requests_total` | `agent_id`, `status` | Low — bounded by registered agents |
| `ai_request_duration_ms` | `agent_id` | Low |
| `ai_request_errors_total` | `agent_id`, `error_code` | Low — platform error enum |
| `ai_tokens_input_total` / `ai_tokens_output_total` | `model`, `provider` | Medium — bounded by configured models |
| `ai_cost_usd_total` | `model`, `provider`, `agent_id` | Medium |
| `ai_embedding_tokens_total` | `model` | Low |
| `ai_tool_invocations_total` | `tool_id`, `status` | Low — registered tools |
| `ai_retrieval_*` | `agent_id` | Low |
| Guard counters | `reason`, `scope`, `guard` | Low fixed sets |

## Implementation

- `platform-metrics.ts` strips disallowed labels before export
- Forbidden keys (`user_id`, `course_id`, …) are dropped even if accidentally passed
- Legacy duplicate metric names (`ai_agent_runs_total`, etc.) follow the same rules

## Operational guidance

1. Do **not** add per-user or per-course labels to OTEL metrics — use PostgreSQL ledger for billing drill-down
2. Prefer `agent_id` over free-form feature names in new metrics
3. Review new counters in PRs against this table
4. Alert on Prometheus label cardinality if `model` label exceeds configured model list significantly (misconfiguration signal)

## Related

- [AI Usage Observability Plan](../ai-usage-observability-plan.md)
- [Production Readiness Checklist](./production-readiness-checklist.md)
- [`metric-labels.ts`](../../src/ai-platform/observability/metrics/metric-labels.ts)
