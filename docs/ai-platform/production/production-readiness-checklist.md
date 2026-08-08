# Production Readiness Checklist — AI Usage Observability

> **Status:** Verified August 2026 (Phase 9)  
> **Scope:** Phases 1–8 of [AI Usage Observability Plan](../ai-usage-observability-plan.md)

Use this checklist before enabling AI observability in production or after deploy.

---

## 1. Automated verification (Phase 9)

| Command | Result (Aug 2026) | Notes |
|---------|-------------------|-------|
| `pnpm test:unit` | ✅ 85 passed | Includes all observability unit tests |
| `pnpm test:integration` | ✅ 7 passed | Requires `VITEST_INTEGRATION=true` + DB |
| `pnpm test` | ✅ 86 passed, 6 skipped | Integration skipped without env flag |
| `pnpm lint` | ✅ 0 errors | 44 pre-existing warnings (scripts, unrelated) |
| `pnpm type-check` | ⚠️ Pre-existing failures | `.next/types/validator.ts` + layout params — not observability-related |

### Observability unit test coverage

| Test file | Area |
|-----------|------|
| `usage-normalizer.test.ts` | Provider usage normalization |
| `llm-provider-usage.test.ts` | OpenAI / Anthropic / Gemini parsing |
| `token-pricing.test.ts` | USD cost computation |
| `cost-ledger.test.ts` | Ledger start/complete/fail |
| `cost-analytics.test.ts` | Dashboard analytics queries |
| `otel-setup.test.ts` | OTEL init, sampling, graceful disable |
| `otel-attributes.test.ts` | Span attribute sanitization |
| `telemetry-isolation.test.ts` | OTEL failure isolation + metric labels |
| `ai-observability-phase5.test.ts` | Structured logs + run outcome metrics |
| `ai-analytics-dashboard.test.ts` | Date range + formatter helpers |
| `fallback-chain.test.ts` | Provider fallback routing |

---

## 2. Database & migrations

- [ ] Apply migration `20260808130000_add_ai_run_billing_columns` (billing columns on `ai_agent_runs`)
- [ ] Apply migration `20260808140000_add_ai_analytics_indexes` (dashboard query indexes)
- [ ] Run `pnpm prisma:generate` after schema changes (do not hand-edit `src/generated/prisma`)
- [ ] Confirm `worker:ai-cost-aggregation` is running in production

---

## 3. Environment variables

- [ ] `AI_PLATFORM_ENABLED=true`
- [ ] `AI_TUTOR_ENABLED=true` (if tutor live)
- [ ] `OTEL_ENABLED=true`
- [ ] `OTEL_SERVICE_NAME=ithracode-ai-platform`
- [ ] `OTEL_EXPORTER_OTLP_ENDPOINT` → collector (see [vps-observability.env.example](./vps-observability.env.example))
- [ ] `OTEL_METRICS_PORT=9464` (Prometheus scrape)
- [ ] `OTEL_TRACES_SAMPLER=parentbased_traceidratio`
- [ ] `OTEL_TRACES_SAMPLER_ARG=0.1` (or lower for high traffic)
- [ ] `AI_ADMIN_API_SECRET` set (ops Bearer API only — not in browser)
- [ ] `INTERNAL_HEALTH_TOKEN` set for `/api/health/ai-platform`
- [ ] Optional: `OTEL_BSP_*` tuning under load

Reference: [vps-observability.env.example](./vps-observability.env.example)

---

## 4. Token accounting & cost ledger

- [ ] Provider usage captured for OpenAI, Anthropic, Gemini (`onUsage` callbacks)
- [ ] `tokenUsageEstimated` persisted on `ai_agent_runs` when fallback used
- [ ] `computeRunCostUsd` uses model from actual run (not router default)
- [ ] Ledger write failure → warn log, request continues
- [ ] Budget guard failure → fail-closed (deny request)
- [ ] Daily aggregation populates `ai_usage_daily`

Manual scripts (staging):

```bash
tsx scripts/ai-tutor-p0/verify-token-accounting.ts
tsx scripts/ai-tutor-p0/verify-usd-budget.ts
```

---

## 5. OpenTelemetry & tracing

- [ ] Traces export to collector/Tempo when endpoint configured
- [ ] Prometheus scrapes `:9464/metrics`
- [ ] `/api/health/ai-platform` returns JSON health (no legacy in-memory Prometheus text)
- [ ] Span attributes contain hashed IDs only — no raw `userId` / prompts ([otel-attributes.ts](../../../src/ai-platform/observability/opentelemetry/otel-attributes.ts))
- [ ] Guard spans nested under `ai.agent.run`
- [ ] Streaming attrs: `ai.llm.time_to_first_token_ms`, `ai.stream.time_to_first_token_ms`
- [ ] OTEL exporter down → AI requests continue ([telemetry-isolation.ts](../../../src/ai-platform/observability/opentelemetry/telemetry-isolation.ts))

Collector reference: [otel-collector.config.yaml](./otel-collector.config.yaml)

---

## 6. Metrics & structured logging

- [ ] Core counters: `ai_requests_total`, `ai_request_errors_total`, `ai_cost_usd_total`
- [ ] Token counters split: `ai_tokens_input_total`, `ai_tokens_output_total`, `ai_embedding_tokens_total`
- [ ] Metric labels pass allowlist — no `user_id` / `course_id` ([cardinality-review.md](./cardinality-review.md))
- [ ] Structured events: `ai.agent.run.completed` / `ai.agent.run.failed` with `traceId`, `correlationId`
- [ ] No prompt/response in structured logs

---

## 7. Admin dashboard

- [ ] Route `/admin/analytics/ai` accessible to `Role.ADMIN` only (session auth)
- [ ] Overview cards, trend charts (lazy Recharts), model breakdown table render
- [ ] Date filter `?days=7|30|90` works
- [ ] Bearer ops API `/api/admin/ai/overview` and `/breakdown` reject unauthenticated calls
- [ ] UI uses Server Actions — Bearer secret not exposed to browser

---

## 8. Security & privacy

- [ ] Review [security-privacy-review.md](./security-privacy-review.md)
- [ ] Review [cardinality-review.md](./cardinality-review.md)
- [ ] LangSmith PII redaction enabled if tracing to LangSmith
- [ ] Rotate `AI_ADMIN_API_SECRET` if ever exposed

---

## 9. Post-deploy smoke (manual)

- [ ] Send one tutor message → verify `ai_agent_runs` row with tokens + cost
- [ ] Confirm trace in Tempo/Grafana (sampled)
- [ ] Confirm `:9464/metrics` exposes `ai_requests_total`
- [ ] Open admin dashboard → overview matches ledger totals for date range
- [ ] Kill OTEL collector temporarily → tutor still responds; warn logs only

---

## 10. Out of scope (V1)

| Item | Reference |
|------|-----------|
| Cost Engine (budgets/quotas/forecast UI) | [16-cost-engine.md](../16-cost-engine.md) |
| Indexing embedding ledger rows | OTEL span only today |
| E2E browser tests for dashboard | Manual checklist above |

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Platform engineer | | | |
| DevOps | | | |
| Engineering lead | | | |
