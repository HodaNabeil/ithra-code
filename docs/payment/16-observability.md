# 16 - Payment Observability

Operational visibility for the IthraCode payment platform: trace context, structured logs, metrics, health checks, and alert guidance.

**Related:** [11-go-live-checklist.md](./11-go-live-checklist.md) · [14-production-operations-runbook.md](./14-production-operations-runbook.md)

---

## Trace Context

`PaymentTraceContext` (`src/lib/observability/payment-trace.ts`) uses `AsyncLocalStorage` to propagate:

| Field | Source |
| :--- | :--- |
| `traceId` | Generated per request (`randomUUID`) |
| `correlationId` | `x-correlation-id` or `x-request-id` header, or generated |
| `orderId` | Set after checkout/webhook resolves order |
| `paymentId` | Optional enrichment |
| `userId` | Set from auth session on checkout |

`paymentLogger` (`src/lib/observability/payment-logger.ts`) auto-injects trace fields into structured logs.

---

## Correlation IDs

Checkout and webhook routes accept `x-correlation-id` and echo it in the response header. Use the same ID across frontend → API → logs for incident triage.

---

## Health Check

`GET /api/health/payment`

| Check | Healthy when |
| :--- | :--- |
| `database` | `SELECT 1` succeeds |
| `redis` | `PING` returns `PONG` |
| `paymobConfigured` | `readPaymobConfig()` non-null (`skipped` if absent — does not fail health) |

Returns `200` when DB + Redis are ok; `503` when degraded.

---

## Metrics Port

`MetricsRecorder` (`application/ports/metrics.recorder.ts`) with `LoggingMetricsRecorder` adapter — structured log events for counters/histograms until Prometheus/OTEL is wired.

| Metric | Type | Labels |
| :--- | :--- | :--- |
| `payment_checkout_success` | counter | `provider`, `reused` |
| `payment_checkout_error` | counter | — |
| `payment_checkout_duration_ms` | histogram | `provider` |
| `payment_webhook_processed` | counter | `duplicate`, `fulfilled` |
| `payment_webhook_error` | counter | — |
| `payment_webhook_duration_ms` | histogram | — |

---

## Log Event Catalog

| Event | Meaning |
| :--- | :--- |
| `[PAYMENT_CHECKOUT_COMPLETED]` | Checkout API succeeded |
| `[PAYMENT_CHECKOUT_ERROR]` | Checkout API error |
| `[PAYMOB_WEBHOOK_PROCESSED]` | Webhook fulfilled or idempotent skip |
| `[PAYMOB_WEBHOOK_ERROR]` | Webhook route error |
| `[PAYMOB_WEBHOOK_INVALID_HMAC]` | Bad signature |
| `[PAYMENT_RECONCILE_PROCESSED]` | Single payment reconcile decision applied |
| `[PAYMENT_RECONCILE_BATCH_COMPLETE]` | Reconcile batch summary (`deferred`, `abandoned`, `manualReview`, …) |
| `[PAYMENT_RECONCILE_ERROR]` | Reconcile provider/DB error |
| `[PAYMENT_METRIC_COUNTER]` / `payment_reconcile_*` | `fulfilled`, `failed`, `deferred`, `abandoned`, `manual_review`, `error` |
| `[PAYMENT_METRIC_HISTOGRAM]` / `payment_reconcile_latency_ms` | Per-attempt inquiry+decision latency |
| `[ORDER_COMPLETED_DLQ]` | BullMQ job failed after retries |
| `[CONFIRMATION_EMAIL_SENT]` / `[CONFIRMATION_EMAIL_SKIPPED]` | Email worker |
| `[INVOICE_GENERATED]` | PDF invoice created |
| `[ANALYTICS_PURCHASE_COMPLETED]` | Analytics port (log/no-op) |
| `[PAYMOB_RETRY]` | Gateway HTTP retry attempt |
| `[PAYMOB_TRANSACTION_NOT_FOUND]` | Inquiry 404 mapped to `not_found` (inconclusive) |

---

## Alert Rules (recommended)

| Alert | Condition | Severity |
| :--- | :--- | :--- |
| Stuck payments | `PROCESSING` > 45 min without progress / rising `MANUAL_REVIEW` | Warning |
| Reconcile errors | `[PAYMENT_RECONCILE_ERROR]` rate > 5/hour | Warning |
| Manual review backlog | `reconcileStatus=MANUAL_REVIEW` count > threshold | Warning |
| Webhook HMAC failures | `[PAYMOB_WEBHOOK_INVALID_HMAC]` spike | Critical |
| DLQ growth | `[ORDER_COMPLETED_DLQ]` any occurrence | Warning |
| Health degraded | `/api/health/payment` returns 503 | Critical |

---

## OTEL / Sentry Hooks (future)

Instrument spans at: checkout use case entry, provider HTTP call, webhook HMAC verify, fulfillment UoW commit, reconcile batch, BullMQ publish. Sentry breadcrumbs: `correlationId`, `orderId`, `providerEventId`.
