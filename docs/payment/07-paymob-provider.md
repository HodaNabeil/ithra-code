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

### Error Mapping Table

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
To prevent API calls from hanging indefinitely and blocking application threads, the gateway enforces a strict **5-second timeout** on all HTTP requests to Paymob.

### 2. Transient Failure Retries
For transient network errors (e.g., TCP connection resets, DNS resolution failures, or HTTP `502`/`503`/`504` status codes), the gateway implements an exponential backoff retry strategy:
*   **Max Retries**: 3 attempts.
*   **Initial Delay**: 500ms.
*   **Backoff Factor**: 2 (500ms, then 1000ms, then 2000ms).
*   **Jitter**: Introduce random noise (+/- 100ms) to prevent thundering herd problems on Paymob's servers.

---

## Webhook Verification Architecture
Paymob notifies IthraCode of payment outcomes via signed webhooks. The gateway is responsible for verifying the authenticity of these notifications:
*   **HMAC Signature**: Paymob calculates an HMAC signature using a shared Webhook Secret and concatenates specific payload fields (e.g., amount, currency, transaction ID, success status).
*   **Verification**: The gateway extracts the signature from the request query parameters, re-calculates the HMAC signature locally using the shared secret, and compares the two values. If they do not match, the payload is rejected immediately, preventing fraud.

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
