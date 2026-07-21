# IthraCode Payment Platform Documentation Index

Welcome to the documentation for the **IthraCode Payment Platform**. This directory contains the comprehensive architectural specifications, implementation plans, and technical designs for our secure, provider-agnostic payment system.

---

## 🗺️ Document Map

The documentation is organized sequentially to guide you from high-level architecture down to specific implementation details and security controls:

```
docs/payment/
├── 00-index.md                       <-- You are here
├── 01-payment-architecture.md        # Core Architectural Blueprint
├── 02-payment-implementation-plan.md # 8-Phase Engineering Roadmap
├── 03-create-checkout-usecase.md     # Checkout Initiation Specification
├── 04-sprint-2-infrastructure.md     # Sprint 2 Scope & Deliverables
├── 05-unit-of-work.md                # Transaction & Concurrency Control
├── 06-repository-layer.md            # Persistence Abstraction Standards
├── 07-paymob-provider.md             # Paymob Gateway Integration
├── 08-webhook.md                     # Webhook Ingestion & Idempotency
├── 09-fulfillment.md                 # Post-Payment Delivery Engine
├── 10-security.md                    # Security Controls & Compliance
└── 11-go-live-checklist.md           # Phase 10 Staging & Production Checklist
```

---

## 📄 Document Directory

### [01 - Payment Architecture Specification](./01-payment-architecture.md)
*   **Purpose**: Defines the authoritative design specification and structural boundaries of the payment module.
*   **Key Topics**:
    *   Multi-provider support and provider-agnostic core rules.
    *   Clean Architecture & Domain-Driven Design (DDD) layer responsibilities.
    *   Strict monetary rules (integer storage, no floating-point math).
    *   Transaction boundaries and failure recovery strategies.

### [02 - Payment Platform Implementation Plan](./02-payment-implementation-plan.md)
*   **Purpose**: Outlines the corrected 11-phase engineering roadmap (Phase 0 to Phase 10) for building the payment platform.
*   **Key Topics**:
    *   Phased breakdown from Domain Setup to Go-Live (repositories before UoW; API before Paymob).
    *   Concrete deliverables, dependencies, and exit criteria for each phase.
    *   Risk mitigation strategies.

### [03 - Create Checkout Use Case Specification](./03-create-checkout-usecase.md)
*   **Purpose**: Technical specification for initiating a checkout session.
*   **Key Topics**:
    *   Main execution flow of the `CreateCheckoutUseCase`.
    *   Cart validation, price calculation, and local record creation.
    *   External provider session resolution and redirection.
    *   Detailed failure scenarios and error mapping.

### [04 - Sprint 2 Infrastructure Specification](./04-sprint-2-infrastructure.md)
*   **Purpose**: Direct guide for developers implementing the persistence and gateway infrastructure during Sprint 2.
*   **Key Topics**:
    *   Sprint scope, concrete deliverables, and execution risks.
    *   Prisma repository mappings.
    *   Paymob gateway communication setup.

### [05 - Unit of Work Pattern Specification](./05-unit-of-work.md)
*   **Purpose**: Architectural design of transaction boundaries and concurrency control.
*   **Key Topics**:
    *   Why the Unit of Work (UoW) pattern is used in Clean Architecture.
    *   Strict isolation of database transactions from external network calls.
    *   Concurrency control, double-click prevention, and retry mechanisms.

### [06 - Repository Layer Specification](./06-repository-layer.md)
*   **Purpose**: Standards for isolating core business logic from database persistence.
*   **Key Topics**:
    *   Data mapping strategies (Domain Entities vs. Prisma Models).
    *   Query optimization and indexing rules.
    *   Repository anti-patterns to avoid.

### [07 - Paymob Provider Integration Specification](./07-paymob-provider.md)
*   **Purpose**: Technical integration details for our primary gateway (Paymob).
*   **Key Topics**:
    *   `PaymobGateway` implementation of the `PaymentProviderGateway` interface.
    *   Authentication, order creation, and payment key generation flows.
    *   Error mapping and gateway-specific retry strategies.

### [08 - Webhook Processing Specification](./08-webhook.md)
*   **Purpose**: Secure ingestion and processing of asynchronous payment notifications.
*   **Key Topics**:
    *   Webhook lifecycle and raw body parsing.
    *   Cryptographic HMAC signature verification.
    *   Strict idempotency controls to prevent double-fulfillment.

### [09 - Fulfillment Specification](./09-fulfillment.md)
*   **Purpose**: Post-payment fulfillment engine responsible for delivering purchased courses.
*   **Key Topics**:
    *   Transactional (synchronous) vs. Asynchronous execution zones.
    *   Course enrollment and cart cleanup.
    *   Resilient retry strategies for background jobs (emails, invoices, analytics).

### [10 - Payment Platform Security Specification](./10-security.md)
*   **Purpose**: Security architecture, fraud prevention, and PCI-DSS compliance standards.
*   **Key Topics**:
    *   Defense in Depth across API, application, database, and network layers.
    *   Strict card handling rules (no raw PAN/CVV storage).
    *   Rate limiting, secret management, and audit logging.

### [11 - Go-Live Checklist](./11-go-live-checklist.md)
*   **Purpose**: Operational checklist for staging E2E sign-off and production cutover (Phase 10).
*   **Key Topics**:
    *   End-to-end staging suite (checkout, webhook, duplicates, rate limits).
    *   Security hardening and secret rotation.
    *   Monitoring log events and production cutover steps.

---

## 🚀 Core Architectural Principles

All developers working on the payment platform must adhere to these five core principles defined in the architecture:

1.  **Server is the Single Source of Truth**: Prices, discounts, and totals are never calculated on or accepted from the client.
2.  **Orders are Immutable**: Once an order is created, its prices and items are frozen historically.
3.  **Webhook is the Absolute Source of Truth**: Enrollment and order completion are strictly triggered by verified, cryptographic webhooks, never by client-side redirects.
4.  **Provider-Agnostic Core**: The Domain and Application layers remain completely unaware of gateway-specific technical details.
5.  **Clean Architecture & DDD**: Dependencies flow strictly inward. No database or framework details leak into the core domain.
