# 11 - Go-Live Checklist (Phase 10)

## Purpose

Operational checklist for staging sign-off and production launch of the payment platform. Complements [10-security.md](./10-security.md).

---

## Pre-requisites

- [ ] Phases 0–9 delivered and reviewed
- [ ] `CheckoutSession` and `WebhookEvent` migrations applied in staging and production
- [ ] Paymob sandbox credentials configured (`PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_IDS`)
- [ ] Redis available for rate limiting and BullMQ workers
- [ ] `npm run worker:order-completed` (and legacy `npm run worker` if Stripe path still active) running as supervised processes

---

## End-to-End Staging Suite

1. **Checkout (fake gateway)** — unset Paymob secrets; `POST /api/payment/checkout` returns `201` with a redirect URL; DB contains `PENDING` order + payment and an `OPEN` checkout session.
2. **Checkout (Paymob sandbox)** — configure secrets; checkout returns a Paymob unified-checkout URL; Tx1 commits before the provider call.
3. **Webhook success** — post a signed Paymob processed-transaction payload to `POST /api/payment/webhooks/paymob?hmac=...`; expect order `COMPLETED`, payment `SUCCEEDED`, ACTIVE enrollments, empty cart, and `OrderCompleted` jobs enqueued.
4. **Webhook invalid HMAC** — expect `401 INVALID_SIGNATURE`; no DB mutations.
5. **Webhook duplicate** — replay the same payload; expect `200` with `duplicate: true`; no double enrollment.
6. **Webhook failure outcome** — `success=false` marks payment `FAILED`; no enrollment.
7. **Rate limits** — exceed 5 checkout requests/user/min → `429 RATE_LIMIT_EXCEEDED`.

---

## Security Hardening

- [ ] Secrets only in environment / vault (never committed); rotation schedule every 90 days documented in runbooks
- [ ] HMAC verified with `timingSafeEqual` (already in `paymob.hmac.ts`)
- [ ] Checkout requires authenticated session; `userId` never accepted from the client body
- [ ] Rate limits active on checkout and webhook routes
- [ ] Zero card data stored (PCI SAQ-A via hosted checkout)

---

## Monitoring & Alerts

Instrument / alert on these structured log events:

| Event | Source | Suggested alert |
| --- | --- | --- |
| `[PAYMENT_CHECKOUT_ERROR]` | checkout route | Error rate > threshold |
| `[PAYMOB_CREATE_SESSION_ERROR]` | PaymobGateway | Spike in provider failures |
| `[PAYMOB_WEBHOOK_INVALID_HMAC]` | webhook route | Immediate (possible attack) |
| `[PAYMOB_WEBHOOK_ERROR]` | webhook route | Error rate / 5xx to provider |
| `[ORDER_COMPLETED_PUBLISH_FAILED]` | publisher | Queue / Redis health |
| `[ORDER_COMPLETED_DLQ]` | worker | DLQ / exhausted retries |
| `[PAYMENT_RECONCILE_ERROR]` | reconcile use case | Stuck PROCESSING payments |
| `[PAYMOB_RETRY]` | PaymobGateway | Provider retry attempts |

**Health check:** `GET /api/health/payment` — DB + Redis must be ok. See [16-observability.md](./16-observability.md).

**Reconciliation:** Schedule `pnpm payment:reconcile` every 15 minutes or run `pnpm worker:reconcile`.

---

## Production Cutover

- [ ] Point Paymob production webhook URL at `/api/payment/webhooks/paymob`
- [ ] Swap sandbox keys for production keys via secret manager
- [ ] Confirm FakePaymentGateway is **not** registered for `PAYMOB` in production (config must be complete)
- [ ] Smoke-test one real low-value purchase end-to-end
- [ ] Engineering + product sign-off
