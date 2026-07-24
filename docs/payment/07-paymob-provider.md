# 07 - Paymob Provider Integration Specification

## Purpose
This document defines the integration architecture for the Paymob payment gateway within the IthraCode Payment Platform. It specifies how the platform interacts with Paymob's systems, including authentication, session creation, metadata mapping, redirect generation, error handling, and retry strategies. It focuses on architectural design and provider abstraction rather than listing volatile API endpoints.

---

## Overview
Paymob is the primary payment provider for the IthraCode platform, serving the Egyptian and regional markets. The integration is encapsulated within the `PaymobGateway` class, which implements the domain's `PaymentProviderGateway` interface. This design isolates all Paymob-specific logic, preventing external API details from leaking into the core application or domain layers.

---

## Abstraction Architecture

The `PaymobGateway` acts as a translator between the IthraCode payment domain and Paymob's external API.

```
┌────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                   │
│                                                        │
│   Calls: PaymentProviderGateway.createCheckoutSession  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌──────────────────────────┴─────────────────────────────┐
│                  INFRASTRUCTURE LAYER                  │
│                                                        │
│   class PaymobGateway implements PaymentProviderGateway│
│   ┌────────────────────────────────────────────────┐   │
│   │ 1. Authenticate with Paymob                    │   │
│   │ 2. Map Domain Input ──► Paymob API Payload     │   │
│   │ 3. Execute HTTP Requests with Timeouts/Retries │   │
│   │ 4. Map Paymob API Response ──► Domain Result   │   │
│   └────────────────────────────────────────────────┘   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌──────────────────────────┴─────────────────────────────┐
│                      PAYMOB API                        │
│           (External Server-to-Server Calls)            │
└────────────────────────────────────────────────────────┘
```

---

## Integration Lifecycle & Sequence

Creating a checkout session with Paymob is a multi-step process that must be orchestrated seamlessly within the gateway implementation:

1.  **Authentication**: The gateway exchanges the secret API Key for a short-lived bearer token.
2.  **Order Registration**: The gateway registers the order details (amount, currency, merchant order ID) with Paymob to establish a transaction record.
3.  **Payment Key Generation**: The gateway requests a payment key for the registered order, specifying the integration ID (e.g., Credit Card iframe ID), billing details (required by Paymob), and redirect URLs.
4.  **Redirection URL Assembly**: The gateway constructs the final payment iframe URL containing the generated payment key and returns it to the application layer.

---

## Metadata & Payload Mapping

To ensure complete decoupling, the gateway maps internal domain models to Paymob's expected formats:

*   **Amount Conversion**: Internal amounts are stored in cents (integers). Paymob expects amounts in the smallest currency unit (piasters for EGP), which aligns perfectly with our integer storage strategy.
*   **Merchant Order ID**: The internal `orderId` is mapped to Paymob's `merchant_order_id` to ensure absolute traceability during reconciliation and webhook processing.
*   **Billing Data Defaults**: Paymob requires billing data (first name, last name, email, phone number) to generate a payment key. The gateway maps the authenticated student's profile details to these fields. If any optional fields are missing (e.g., phone number), the gateway injects safe, standardized placeholders (e.g., `+201000000000`) to prevent API rejection.

---

## Error Handling & Mapping
External API calls are prone to network failures, rate limits, and validation errors. The gateway must catch these exceptions and map them to domain-specific errors.

### Malformed or Unexpected Provider Responses

| Condition | HTTP to Client | Code | Behavior |
| :--- | :--- | :--- | :--- |
| HTTP 2xx but missing `client_secret` | `502` | `PROVIDER_UNAVAILABLE` | Logged as `[PAYMOB_CREATE_SESSION_ERROR]`; Tx1 order/payment remain `PENDING` |
| Non-JSON or unparseable response body | `503` | `PROVIDER_UNAVAILABLE` | Axios error caught; no session saved |
| Unexpected JSON shape (missing required fields) | `502` or `503` | `PROVIDER_UNAVAILABLE` | Same as above |
| HTTP 401 from Paymob | `503` | `PROVIDER_UNAVAILABLE` | Configuration/secret issue |
| HTTP 400 from Paymob | `503` | `PROVIDER_UNAVAILABLE` | Logged with response body for triage |
| HTTP 429 from Paymob | `503` | `PROVIDER_UNAVAILABLE` | User asked to retry later |
| HTTP 5xx from Paymob | `503` | `PROVIDER_UNAVAILABLE` | Transient provider failure |
| Network timeout / DNS / connection reset | `503` | `PROVIDER_UNAVAILABLE` | Order/payment remain `PENDING` |

### Error Mapping Table (deprecated reference — not implemented)

> The exception types below (`ConfigurationError`, `ALREADY_EXISTS`, `INVALID_PRICING`) do not exist in the current codebase. Kept for historical reference only.

| Paymob HTTP Status | Paymob Error Code | Domain Exception | Localized Message |
| :--- | :--- | :--- | :--- |
| `401 Unauthorized` | `INVALID_API_KEY` | `ConfigurationError` | "خطأ في إعدادات نظام الدفع" |
| `400 Bad Request` | `DUPLICATE_ORDER` | `CheckoutError(ALREADY_EXISTS)` | "هذا الطلب تم إنشاؤه مسبقاً" |
| `400 Bad Request` | `INVALID_AMOUNT` | `CheckoutError(INVALID_PRICING)` | "قيمة الطلب غير صالحة" |
| `429 Too Many Requests`| `RATE_LIMIT_EXCEEDED` | `ProviderUnavailableError` | "نظام الدفع مزدحم حالياً، يرجى المحاولة لاحقاً" |
| `5xx Server Error` | Any | `ProviderUnavailableError` | "مزود الدفع غير متاح حالياً" |

---

## Network Resilience & Retry Strategy

### 1. Request Timeouts
`PaymobGateway` enforces an HTTP timeout on all Paymob requests via `PAYMOB_TIMEOUT_MS` (default **15000** ms).

### 2. Transient Failure Retries

**Implemented** via `executeWithHttpRetry` in `http-retry.executor.ts`, used by `PaymobGateway` for Intention API and transaction inquiry calls.

*   **Max Retries**: `PAYMOB_RETRY_MAX` (default 3).
*   **Initial Delay**: `PAYMOB_RETRY_INITIAL_MS` (default 1000ms).
*   **Backoff Factor**: 2 with ±100ms jitter.
*   **Retriable conditions**: TCP resets, DNS failures, HTTP `502`/`503`/`504`, `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`.
*   **No retry**: `400`, `401`, `403`, `404`, `422`, missing `client_secret`.
*   **Log event**: `[PAYMOB_RETRY]` with attempt, delay, status.

### 3. Circuit Breaker

**Not implemented.** There is no circuit breaker or fail-fast open-circuit around Paymob. Under sustained provider outage, each checkout attempt will wait up to 15 seconds before failing. Operations should monitor `[PAYMOB_CREATE_SESSION_ERROR]` and consider a manual kill-switch (disable Paymob in container config) during extended outages.

---

## Webhook Verification Architecture
Paymob notifies IthraCode of payment outcomes via signed webhooks. The gateway is responsible for verifying the authenticity of these notifications:
*   **HMAC Signature**: Paymob calculates an HMAC-SHA512 signature (see `paymob.hmac.ts`) using a shared Webhook Secret and concatenates 20 transaction fields in Paymob's documented lexical order.
*   **Verification**: The route extracts the signature from the `hmac` query parameter, re-calculates the HMAC-SHA512 digest locally, and compares with `crypto.timingSafeEqual`. If they do not match, the payload is rejected with `401 INVALID_SIGNATURE`.

---

## Future Multi-Provider Support
The abstraction pattern ensures that adding future providers (Stripe, PayPal, Moyasar) is straightforward:

```
                               ┌─────────────────────────┐
                               │ PaymentProviderGateway  │
                               └────────────▲────────────┘
                                            │ (Implements)
                ┌───────────────────────────┼───────────────────────────┐
                │                           │                           │
   ┌────────────┴────────────┐ ┌────────────┴────────────┐ ┌────────────┴────────────┐
   │      PaymobGateway      │ │      StripeGateway      │ │      PayPalGateway      │
   └─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

Each new provider implements the same gateway interface, mapping its unique API flows, authentication mechanisms, and webhook signatures into the unified domain models. The `PaymentProviderResolver` handles routing requests to the correct implementation dynamically.
