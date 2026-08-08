# Security & Privacy Review — AI Observability

> **Status:** Reviewed August 2026 (Phase 8)  
> **Scope:** OTEL traces, structured logs, metrics, admin analytics, Bearer ops API

## Summary

| Area | Status | Notes |
|------|--------|-------|
| OTEL span attributes | ✅ | Hashed IDs via `otel-attributes.ts`; forbidden content keys stripped |
| Structured run logs | ✅ | Unified schema; no prompt/response; log write failures isolated |
| OTEL metrics labels | ✅ | Allowlist in `metric-labels.ts`; no user/course/thread labels |
| Cost ledger (PG) | ✅ | Authoritative billing; separate from OTEL |
| Admin dashboard UI | ✅ | NextAuth `Role.ADMIN` session via Server Actions |
| Ops analytics API | ✅ | Bearer `AI_ADMIN_API_SECRET`; not exposed to browser |
| Budget guards | ✅ | Fail-closed on Redis failure (unchanged) |
| Ledger write failures | ✅ | Warn + continue request (unchanged) |
| Telemetry failures | ✅ | `telemetry-isolation.ts` — spans/metrics never throw into agent path |

## Data allowed in telemetry

`provider`, `model`, `agentId`, `status`, token counts, cost, latency, hashed identifiers, typed `errorCode`, `runId`, `correlationId`, `traceId`

## Forbidden in telemetry

Raw `userId`, prompts, responses, RAG chunks, API keys, Authorization headers, course content

## Auth model (intentional split)

| Consumer | Auth | Path |
|----------|------|------|
| Admin UI | Session (`ADMIN`) | `/admin/analytics/ai` → Server Actions |
| Ops scripts / Grafana | Bearer secret | `/api/admin/ai/*` |

Document both paths in runbooks; do not embed Bearer token in frontend.

## LangSmith

LangSmith may receive redacted inputs via `trace-redactor.ts`. OTEL remains the operational system-of-record for infra metrics; PG ledger for cost history.

## Residual risks

| Risk | Mitigation |
|------|------------|
| Arabic token estimate inaccuracy | `tokenUsageEstimated` flag + provider usage preferred |
| High `model` label cardinality if dynamic model strings | Monitor; keep model list config-controlled |
| Bearer secret leakage | Rotate `AI_ADMIN_API_SECRET`; ops-only |

## Related

- [Production Readiness Checklist](./production-readiness-checklist.md)
- [13-security.md](../13-security.md)
- [`otel-attributes.ts`](../../src/ai-platform/observability/opentelemetry/otel-attributes.ts)
- [`ai-event-logger.ts`](../../src/ai-platform/observability/logging/ai-event-logger.ts)
