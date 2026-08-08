# 03 - Create Checkout Use Case Specification

## Purpose
This document provides a detailed functional and technical specification for the `CreateCheckoutUseCase`. It defines the actors, triggers, preconditions, main flow, postconditions, failure scenarios, database changes, and external calls involved in initiating a checkout session. It serves as the definitive guide for engineers implementing the checkout orchestration workflow.

---

## Overview
The `CreateCheckoutUseCase` is the entry point for the payment flow. It orchestrates the process of validating a user's cart, calculating the final price, creating local immutable order and payment records, communicating with the selected payment gateway to establish an external checkout session, and returning a secure redirection URL to the client.

---

## Use Case Details

### Actor
*   **Student**: An authenticated user of the IthraCode platform who wishes to purchase one or more courses currently in their shopping cart.

### Trigger
*   The Student clicks the "Proceed to Payment" (or equivalent) button on the checkout page, selecting a specific payment provider (e.g., Paymob).

### Preconditions
1.  The Student is authenticated and has a valid, active user account.
2.  The Student's shopping cart is not empty and contains at least one course.
3.  The Student has selected a supported payment provider (e.g., `PAYMOB`).
4.  The Student does not already have active enrollments for any of the courses in their cart.

---

## Main Flow of Execution

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant API as API Layer
    participant UseCase as CreateCheckoutUseCase
    participant DB as Database
    participant Provider as Payment Provider

    Student->>API: 1. Request Checkout
    API->>API: 2. Validate Request
    API->>UseCase: 3. execute()
    UseCase->>DB: 4. Load Cart Snapshot
    DB-->>UseCase: Cart Snapshot
    UseCase->>DB: 5. Validate Eligibility & Active Enrollments
    DB-->>UseCase: Enrollment Status
    UseCase->>UseCase: 6. Calculate Pricing
    UseCase->>UseCase: 7. Build Order & Payment
    UseCase->>DB: 8. Save Order & Payment (DB Transaction)
    DB-->>UseCase: Saved Entities
    UseCase->>UseCase: 9. Resolve Gateway
    UseCase->>Provider: 10. Create Session
    Provider-->>UseCase: Session Details & Redirect URL
    UseCase->>DB: 11. Save CheckoutSession & Update Payment (DB Transaction)
    DB-->>UseCase: Saved Session
    UseCase-->>API: 12. Return Redirect URL
    API-->>Student: 13. Redirect User
```

### Business Steps Explained

#### Step 1: Load Cart Snapshot
The use case loads the user's active cart from the `CartRepository`. The cart is mapped to a read-only `CheckoutCartSnapshot` to isolate the payment domain from cart mutations.

#### Step 2: Validate Eligibility & Active Enrollments
The `CheckoutValidator` is invoked to perform the following business checks:
*   **Cart Existence**: Ensures the cart exists and is not empty.
*   **Duplicate Purchase Prevention**: Queries the `CartRepository` to check if the user already has an active enrollment for any course in the cart. If an active enrollment is found, a validation error is thrown to prevent double-purchasing.
*   **Own-Course Prevention**: Rejects checkout when the authenticated user is the instructor of any cart course.
*   **Course Availability**: Each cart course must be `PUBLISHED` and `PUBLIC`; deleted courses are rejected.
*   **Currency Validation**: Only `EGP` and `USD` are supported; mixed-currency carts are rejected.
*   **Coupon Validation**: Active, non-expired coupons must meet minimum order amount (see error matrix).
*   **Provider Validation**: Ensures the selected payment provider is currently supported and active.

#### Step 3: Calculate Pricing
The `PriceCalculatorService` calculates the final financial breakdown:
*   Queries active database records for course prices to prevent client-side price tampering.
*   Converts each course price to integer cents via `Math.round(price × 100)`.
*   Applies any valid coupon codes associated with the cart using integer-cent discount rules (see [01-payment-architecture.md](./01-payment-architecture.md) Monetary Rules).
*   Sets `taxCents = 0` (no tax in current release).
*   Computes `totalCents = max(subtotalCents - discountCents + taxCents, 0)`.

#### Step 4: Build Order and Payment Aggregates
*   `OrderFactory` builds an in-memory, immutable `OrderEntity` with a unique order number, status set to `PENDING`, and `OrderItemEntity` records representing price snapshots for each course.
*   `PaymentFactory` builds an in-memory `PaymentEntity` with status set to `PENDING`, linked to the order, with the calculated total amount and currency.

#### Step 5: Persist Order and Payment (Transaction Boundary)
The use case invokes the `UnitOfWork` to open a database transaction. It persists the `OrderEntity` and `PaymentEntity` atomically. If persistence fails, the transaction is rolled back, and no external calls are made.

#### Step 6: Resolve Provider Gateway
The `PaymentProviderResolver` resolves the concrete `PaymentProviderGateway` implementation (e.g., `PaymobGateway`) registered in the system for the selected provider.

#### Step 7: Create External Provider Checkout Session
The use case calls the resolved gateway's `createCheckoutSession` method. The gateway makes a secure HTTP POST request to the provider's API, passing the order ID, amount, currency, and redirect URLs. The provider returns a session identifier, redirection URL, and expiration timestamp.

#### Step 8: Persist Checkout Session
The use case builds and persists a `CheckoutSessionEntity` (status: `OPEN`) containing the provider's session ID and redirection URL, and updates the `PaymentEntity` status to `PROCESSING` to indicate that the user has been redirected.

---

## Postconditions
1.  An immutable `OrderEntity` is saved in the database with status `PENDING`.
2.  A `PaymentEntity` is saved in the database with status `PROCESSING` and linked to the order.
3.  A `CheckoutSessionEntity` is saved in the database with status `OPEN` and linked to the order.
4.  A secure redirect URL is returned to the client.

---

## API Request Schema

`POST /api/payment/checkout` validates the request body with Zod before invoking the use case:

```typescript
const checkoutSchema = z.object({
  provider: z.enum(['PAYMOB', 'STRIPE', 'PAYPAL', 'CASH']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});
```

| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `provider` | `PAYMOB` \| `STRIPE` \| `PAYPAL` \| `CASH` | Yes | Must be registered in the provider resolver |
| `successUrl` | Valid URL | Yes | Paymob redirect after payment (UI only — not trusted for fulfillment) |
| `cancelUrl` | Valid URL | Yes | Paymob redirect on cancel |

Authentication is required via session JWT. The `userId` is always resolved from the session token — never from the request body.

---

## Checkout Error Matrix

All checkout errors are thrown as `CheckoutError` with a machine-readable `code`. The API layer maps them to HTTP responses via `checkout-error.mapper.ts`. No database records are created for validation failures (steps 1–2 below).

| HTTP | Code | Cause | When |
| :--- | :--- | :--- | :--- |
| `401` | `UNAUTHORIZED` | Missing or invalid session | API layer (before use case) |
| `400` | `VALIDATION_ERROR` | Malformed JSON or Zod schema failure | API layer (`details` includes field errors) |
| `404` | `CART_NOT_FOUND` | User has no active cart | `CheckoutValidator` |
| `400` | `EMPTY_CART` | Cart exists but has zero items | `CheckoutValidator` |
| `400` | `UNSUPPORTED_PROVIDER` | Provider not in enum or not registered | `CheckoutValidator` / `PaymentProviderResolver` |
| `400` | `UNSUPPORTED_CURRENCY` | Currency not in `SUPPORTED_CHECKOUT_CURRENCIES` (`EGP`, `USD`) or mixed-currency cart | `CheckoutValidator` |
| `404` | `COURSE_NOT_FOUND` | Cart item references a deleted or missing course (no `instructorId`) | `CheckoutValidator` |
| `400` | `COURSE_NOT_PUBLISHED` | Course is not `PUBLISHED` + `PUBLIC` | `CheckoutValidator` |
| `400` | `ALREADY_ENROLLED` | User already has an active enrollment for a cart course | `CheckoutValidator` |
| `400` | `OWN_COURSE` | User is the instructor of a cart course | `CheckoutValidator` |
| `400` | `INVALID_COUPON` | Coupon inactive, not yet started, **expired**, below minimum order amount, or otherwise invalid | `CheckoutValidator` (expiry maps to this code — no separate `EXPIRED_COUPON` code) |
| `429` | `RATE_LIMIT_EXCEEDED` | More than 5 checkout requests/user/min or 10/IP/min | API rate limiter |
| `409` | `CHECKOUT_IN_PROGRESS` | Concurrent checkout while Redis lock held | `RedisCheckoutLock` |
| `503` | `CHECKOUT_LOCK_UNAVAILABLE` | Redis unavailable during lock acquire (fail-close) | `RedisCheckoutLock` |
| `500` | `INTERNAL_ERROR` | Unexpected exception (including DB failure during Tx1/Tx2) | API error mapper |
| `502` | `PROVIDER_UNAVAILABLE` | Provider returned an invalid/malformed session response (e.g. missing `client_secret`) | `PaymobGateway` |
| `503` | `PROVIDER_UNAVAILABLE` | Provider timeout, network error, or 5xx from provider | `PaymobGateway` |

### Coupon validity rules (`INVALID_COUPON`)

A coupon is rejected (code `INVALID_COUPON`, HTTP 400) when any of the following is true:

1. `isActive` is `false`
2. `startsAt` is in the future
3. `expiresAt` is in the past (**expired coupons use the same code**)
4. Cart subtotal is below `minOrderAmount`

---

## Failure Cases & Recovery

### 1. Cart is Empty or Missing
*   **Cause**: Client sends a checkout request with no items in the cart, or the user has no cart.
*   **Handling**: `CheckoutValidator` throws `EMPTY_CART` (400) or `CART_NOT_FOUND` (404). No database records are created.

### 2. User Already Enrolled
*   **Cause**: User tries to purchase a course they already own.
*   **Handling**: `CheckoutValidator` throws `ALREADY_ENROLLED` (400). No database records are created.

### 3. Own Course / Unpublished / Deleted Course
*   **Cause**: Cart contains the user's own course, an unpublished course, or a deleted course reference.
*   **Handling**: `OWN_COURSE` (400), `COURSE_NOT_PUBLISHED` (400), or `COURSE_NOT_FOUND` (404). No database records are created.

### 4. Invalid or Expired Coupon
*   **Cause**: Coupon fails any validity rule (see matrix above).
*   **Handling**: `INVALID_COUPON` (400). No database records are created.

### 5. Database Write Failure
*   **Cause**: Database connection timeout, deadlock, or constraint violation during Order/Payment persistence (Tx1 or Tx2).
*   **Handling**: The `UnitOfWork` rolls back automatically. The API returns `INTERNAL_ERROR` (500). No external provider call is initiated if Tx1 fails; if Tx2 fails after a successful provider call, the order/payment remain `PENDING`/`PROCESSING` without a saved session.

### 6. External Provider API Timeout / Failure
*   **Cause**: Paymob API is down, slow (>15s timeout), or returns an error.
*   **Handling**: `PaymobGateway` catches the exception and throws `PROVIDER_UNAVAILABLE` (503). Since Tx1 already committed the `OrderEntity` and `PaymentEntity` as `PENDING`, they remain in the database. The user can retry checkout (see [01-payment-architecture.md](./01-payment-architecture.md) for pending-order policy).

---

## Database Changes
All database operations within the main flow must be executed within their respective transaction boundaries:

| Entity | Operation | Fields Populated | Transaction |
| :--- | :--- | :--- | :--- |
| `Order` | Insert | `id`, `orderNumber`, `userId`, `subtotalCents`, `discountCents`, `taxCents`, `totalCents`, `currency`, `status` (`PENDING`), `couponId`, `createdAt` | Tx 1 (Core) |
| `OrderItem` | Insert | `id`, `orderId`, `courseId`, `priceCents`, `currency`, `status` (`ACTIVE`) | Tx 1 (Core) |
| `Payment` | Insert | `id`, `provider`, `amountCents`, `currency`, `status` (`PENDING`), `createdAt` | Tx 1 (Core) |
| `CheckoutSession` | Insert | `id`, `orderId`, `userId`, `provider`, `providerSessionId`, `status` (`OPEN`), `amountCents`, `currency`, `url`, `expiresAt`, `createdAt` | Tx 2 (Session) |
| `Payment` | Update | `status` (`PROCESSING`), `updatedAt` | Tx 2 (Session) |

---

## External Calls
The only external call permitted in this use case occurs *outside* of the database transaction boundaries:

*   **Target**: Payment Provider API (e.g., Paymob Checkout API).
*   **Protocol**: HTTPS POST.
*   **Payload**:
    ```json
    {
      "amount_cents": 150000,
      "currency": "EGP",
      "merchant_order_id": "ORD-K3J89D-8F92A",
      "success_url": "https://ithracode.com/success",
      "cancel_url": "https://ithracode.com/cancel"
    }
    ```
*   **Response**:
    ```json
    {
      "id": "paymob_session_982347",
      "redirect_url": "https://accept.paymob.com/api/acceptance/iframes/12345?payment_token=xyz",
      "expires_at": "2026-07-19T12:00:00.000Z"
    }
    ```

---

## Response Structure
Upon successful execution, the use case returns the following structured response DTO to the API layer:

```typescript
export type CreateCheckoutResponse = {
  checkoutSession: {
    id: string;
    orderId: string;
    userId: string;
    provider: PaymentProvider;
    providerSessionId: string;
    status: 'OPEN';
    amountCents: number;
    currency: Currency;
    url: string;
    expiresAt: Date;
    createdAt: Date;
  };
  redirectUrl: string;
  expiresAt: Date;
};
```
