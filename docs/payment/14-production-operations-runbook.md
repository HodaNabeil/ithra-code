# 14 - Production Operations Runbook

Operational playbooks for realistic payment platform failure scenarios. Use alongside [11-go-live-checklist.md](./11-go-live-checklist.md) monitoring events and [13-production-readiness-review.md](./13-production-readiness-review.md) known gaps.

---

## Recovery Scenarios (User-Facing)

### User closes browser before completing payment

| State after close | Expected behavior |
| :--- | :--- |
| Order `PENDING`, payment `PENDING` or `PROCESSING` | No enrollment. Cart remains populated. |
| User returns later | Checkout reuses matching `PENDING` order when cart fingerprint matches (see [05](./05-unit-of-work.md)). |
| User completed payment on Paymob but closed tab | Webhook still fires → enrollment happens without success page. |

**UX:** Success page is optional for fulfillment; webhook is SoT.

### User never returns to success page

Enrollment completes when webhook is processed. User discovers courses in "My Courses" on next visit. No action required unless webhook failed (see below).

### Success redirect without webhook

Success page polls `GET /api/orders/:id` every 2s for ~90s. Shows spinner until `order.status === COMPLETED`. Copy explains webhook confirmation is required.

**If polling times out:** Payment may still be processing. User should refresh later or contact support. Ops: check Paymob dashboard + webhook logs.

### Webhook arrives before redirect

Polling finds `COMPLETED` quickly. Idempotent — no duplicate enrollment.

### Webhook arrives hours later

Paymob retries webhooks on non-2xx. Late delivery is handled by idempotent webhook processing. If payment was stuck `PROCESSING` > 30 min, the reconciliation worker (`pnpm payment:reconcile` or `pnpm worker:reconcile`) catches it automatically.

### User refreshes success page

Safe. Polling is read-only; duplicate refresh does not re-trigger fulfillment.

### Provider retries webhook after completion

Returns `200` with `duplicate: true` or `fulfilled: false` (already completed). No double enrollment.

---

## Critical Failure Runbooks

### Payment succeeded but webhook never arrives

**Symptoms:** User charged on Paymob; order stays `PENDING`/`PROCESSING`; no enrollments.

**Detection:** Support ticket; `[PAYMOB_WEBHOOK_PROCESSED]` absent for order ID; payment stuck > 30 min.

**Mitigation (current):**
1. Verify order ID via `special_reference` in Paymob dashboard.
2. Manually POST signed webhook via `pnpm payment:webhook-smoke -- --order-id <uuid>` (staging/sandbox) or replay from Paymob dashboard.
3. Run `pnpm payment:reconcile` or ensure `pnpm worker:reconcile` is scheduled every 15 minutes.
   - Requires `PAYMOB_API_KEY` (legacy API key from Dashboard → Settings → API Keys). Intention `PAYMOB_SECRET_KEY` alone cannot authenticate inquiry.
   - Provider `404 Not Found` is **inconclusive** — reconcile defers with backoff; it does **not** immediately mark FAILED.
   - After the reconcile window is exhausted without a definitive outcome, payments enter `reconcileStatus=MANUAL_REVIEW`.
4. Ops queue:
   - `pnpm payment:reconcile-review --list` — payments in `MANUAL_REVIEW`
   - `pnpm payment:reconcile-review --requeue <paymentId>` — schedule another inquiry
   - `pnpm payment:reconcile-review --abandon <paymentId>` — operator-confirmed fail (no charge)

**Prevention:** Reconciliation worker + policy; alert on `MANUAL_REVIEW` count and `[PAYMENT_RECONCILE_ERROR]` spikes.

---

### Payment succeeded after client/provider timeout

**Symptoms:** User saw 503 `PROVIDER_UNAVAILABLE`; later webhook completes order.

**Behavior:** Tx1 committed `PENDING` order before timeout. Late webhook or manual reconcile completes fulfillment.

**Action:** None if webhook eventually succeeds. Fingerprint-based reuse reduces duplicate `PENDING` orders on retry.

---

### Database temporarily unavailable

| Phase | Impact | Recovery |
| :--- | :--- | :--- |
| Checkout Tx1/Tx2 | `500 INTERNAL_ERROR`; no partial commit | User retries after DB recovery |
| Webhook fulfillment | `500`; provider retries | Automatic on provider retry schedule |
| Success page poll | `500` or stale status | User refreshes after recovery |

**Alert:** Database connection errors in application logs.

---

### Redis outage

See [09-fulfillment.md](./09-fulfillment.md) Infrastructure Outage Runbook.

**Summary:** Rate limits fail-open (checkout/webhooks continue). BullMQ publish may fail → enrollment still succeeds; async jobs delayed.

---

### Queue / worker outage

**Symptoms:** `[ORDER_COMPLETED_PUBLISH_FAILED]` in logs; no confirmation emails.

**Impact:** Enrollment unaffected.

**Actions:**
1. Restore Redis + restart `npm run worker:order-completed`.
2. Inspect DLQ for exhausted retries.
3. Manually re-enqueue jobs for affected `orderId`s if needed.

---

### Duplicate provider callback

Handled automatically. Verify `duplicate: true` in `[PAYMOB_WEBHOOK_PROCESSED]` log; single `WebhookEvent` row.

---

### Unexpected webhook payload

| Issue | Response | Action |
| :--- | :--- | :--- |
| Invalid JSON | `400 VALIDATION_ERROR` | Check Paymob integration version |
| Valid JSON, bad HMAC | `401 INVALID_SIGNATURE` | Rotate secrets if compromised |
| Valid HMAC, unknown order | `404 ORDER_NOT_FOUND` | Investigate environment mismatch / data loss |
| Missing `client_secret` from Paymob API | `502 PROVIDER_UNAVAILABLE` | Check Paymob status; user retries checkout |

---

### Clock skew (replay protection — not implemented)

When timestamp replay is implemented, skew > 5 minutes will reject webhooks. Ensure NTP on app servers. Until then, monitor for duplicate `providerEventId` only.

---

### High traffic / provider latency spikes

**Controls in place:** Short DB transactions, rate limits (5/user, 10/IP checkout; 120/s webhook).

**Degradation:** Each checkout may wait up to 15s on Paymob timeout. No circuit breaker.

**Actions:** Scale app instances; monitor `[PAYMOB_CREATE_SESSION_ERROR]` rate; consider temporary Paymob kill-switch (unset Paymob env vars → `FakePaymentGateway` in dev only; production requires provider config).

---

### Deadlocks during fulfillment

Webhook transaction rolls back → `500` → provider retries. No special deadlock retry in application code.

**Monitor:** Postgres deadlock logs. If frequent, review enrollment insert ordering.

---

### Retry storms

**Outbound (Paymob client):** Not yet retried — single attempt per checkout.

**Inbound (webhook):** Provider retries on `500`. Ensure fulfillment is idempotent (it is). Avoid returning `500` for non-retryable errors like invalid HMAC (`401`).

---

## Reconciliation Scheduler

Run the reconciliation worker every **15 minutes** in production:

```bash
# One-shot (cron-friendly)
pnpm payment:reconcile

# Long-running interval worker
pnpm worker:reconcile
```

**Cron example (every 15 min):**
```
*/15 * * * * cd /app && pnpm payment:reconcile >> /var/log/payment-reconcile.log 2>&1
```

**Env vars:** `PAYMENT_RECONCILE_THRESHOLD_MINUTES` (default 30), `PAYMENT_RECONCILE_BATCH_SIZE` (default 50), `PAYMENT_RECONCILE_INTERVAL_MS` (default 900000).

---

## Monitoring Quick Reference

| Log event | Severity | Runbook section |
| :--- | :--- | :--- |
| `[PAYMOB_WEBHOOK_INVALID_HMAC]` | High | Unexpected payload |
| `[PAYMOB_CREATE_SESSION_ERROR]` | Medium | Provider latency / outage |
| `[ORDER_COMPLETED_PUBLISH_FAILED]` | Medium | Queue / Redis outage |
| `[PAYMENT_CHECKOUT_ERROR]` | Medium | Checkout error matrix in 03 |
| `[PAYMOB_WEBHOOK_ERROR]` | High | Webhook HTTP matrix in 08 |
| `[PAYMENT_RECONCILE_ERROR]` | High | Missing webhook / stuck PROCESSING |
| `[PAYMENT_RECONCILE_BATCH_COMPLETE]` | Info | Reconcile batch summary |
| `[ORDER_COMPLETED_DLQ]` | Medium | Async fulfillment failure |

---

## Out of Scope (Phase 1)

Refunds, chargebacks, admin force-complete, order expiry cron, coupon usage races, and `Idempotency-Key` header are not documented or implemented. Track as future work.
