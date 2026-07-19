# 05 - Unit of Work Pattern Specification

## Purpose
This document defines the architectural specification for the Unit of Work (UoW) pattern within the IthraCode Payment Platform. It explains the design rationale, transaction boundaries, repository integration, failure recovery, and retry strategies. It establishes the critical engineering rules governing database transaction boundaries and external network communication.

---

## Overview
The Unit of Work pattern maintains a list of business operations affected by a single business transaction. It coordinates the writing of changes and the resolution of concurrency problems. In IthraCode, the Unit of Work acts as the gatekeeper for database transactions, ensuring that multiple repository operations succeed or fail as a single atomic unit.

---

## Why Unit of Work?
In a clean architecture codebase, business use cases coordinate multiple repositories to achieve a business goal. For example, creating a checkout requires:
1.  Saving an `OrderEntity` via `OrderRepository`.
2.  Saving a `PaymentEntity` via `PaymentRepository`.

Without a Unit of Work, each repository would manage its own database connection and commit its changes independently. If saving the Order succeeds but saving the Payment fails, the database is left in an inconsistent, corrupted state.

The Unit of Work solves this by exposing a unified transaction boundary across multiple repositories, ensuring that all writes are committed together or rolled back completely.

---

## Responsibilities
The `UnitOfWork` is responsible for:
1.  **Transaction Orchestration**: Starting, committing, and rolling back database transactions.
2.  **Context Sharing**: Providing repositories with a shared transactional database client (e.g., Prisma transaction client) to ensure all queries execute within the same transaction context.
3.  **Atomicity**: Enforcing that all database operations within its boundary either succeed together or leave the database completely untouched.

---

## Non-Responsibilities
The `UnitOfWork` is explicitly NOT responsible for:
1.  **Executing Business Logic**: It does not validate data, calculate prices, or make business decisions.
2.  **External Network Calls**: It must never manage, wrap, or execute external API requests (e.g., calling Paymob or sending emails).
3.  **Direct SQL Execution**: It delegates all actual database reads and writes to the repositories.

---

## Transaction Boundary Rules

### Critical Engineering Decision: Commit BEFORE External Call
The database transaction MUST be committed before communicating with external payment providers (e.g., Paymob).

```mermaid
sequenceDiagram
    autonumber
    participant UseCase as Use Case
    participant UoW as Unit of Work
    participant Repos as Repositories
    participant Provider as Paymob API

    UseCase->>UoW: start()
    UoW->>UoW: BEGIN TRANSACTION
    UseCase->>Repos: save(order)
    UseCase->>Repos: save(payment)
    UseCase->>UoW: commit()
    UoW->>UoW: COMMIT TRANSACTION
    UseCase->>Provider: createCheckoutSession() (HTTP POST)
```

### Rationale: Why We Commit Before the External Call
1.  **Connection Pool Protection**: Database transactions hold database connections open. External HTTP calls are slow and highly volatile (taking anywhere from 200ms to several seconds). Executing an HTTP call inside a database transaction keeps the connection locked, leading to rapid connection pool exhaustion and application downtime under load.
2.  **Orphan Prevention**: If we call Paymob first and then attempt to write to the database, a database write failure (e.g., unique constraint violation or database timeout) would leave an orphaned checkout session active on Paymob's servers. The user might pay for a session that has no corresponding order in our database.
3.  **Database as Source of Truth**: By committing first, the local database is established as the absolute source of truth. If the subsequent external call fails, the system has a record of the intent to purchase (`PENDING` order) and can recover gracefully.

---

## Transaction Client & Repository Integration
To support both transactional and non-transactional operations, repositories must be designed to accept an optional transaction client.

### Abstract Interface Contract

```typescript
export interface UnitOfWork {
  /** Executes a set of repository operations within an atomic database transaction */
  runInTransaction<T>(work: (txClient: unknown) => Promise<T>): Promise<T>;
}
```

### Repository Integration Pattern
Repositories must check for the presence of the shared transaction client before executing database queries:

```typescript
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly globalPrisma: PrismaClient) {}

  async save(order: OrderEntity, txClient?: unknown): Promise<OrderEntity> {
    // Use the transaction client if provided, otherwise fallback to the global client
    const client = (txClient as PrismaClient) ?? this.globalPrisma;
    
    await client.order.upsert({
      where: { id: order.id },
      create: OrderMapper.toPrisma(order),
      update: OrderMapper.toPrisma(order),
    });

    return order;
  }
}
```

---

## Failure Scenarios & Recovery

### Scenario 1: Database Write Fails During Core Transaction
*   **Behavior**: The `UnitOfWork` catches the database error, triggers an automatic rollback of all pending writes, and releases the database connection.
*   **Result**: No order or payment records are saved. No external call is made. The user receives a graceful error message and can try again.

### Scenario 2: External Gateway Call Fails After Commit
*   **Behavior**: The database transaction is already committed; the `OrderEntity` and `PaymentEntity` are saved as `PENDING`. The HTTP call to Paymob fails or times out.
*   **Result**: The use case catches the network exception and returns a graceful error to the user. The order remains in the database in a `PENDING` state.
*   **Recovery**: The user can safely click "Checkout" again. The system detects the existing pending order, cancels the previous payment attempt, and initiates a new provider call.

---

## Retry Strategy & Reconciliation
External provider failures must be retryable. To handle edge cases where a user pays but a network failure prevents the redirect or webhook from completing, the system implements two layers of reconciliation:

### 1. User-Initiated Retry
If a user returns to their cart and attempts to checkout again while a pending order exists:
*   The system does not create a new order.
*   It resolves the existing `PENDING` order and updates or replaces the linked `PaymentEntity`.
*   It initiates a fresh checkout session with the payment provider.

### 2. Automated Reconciliation Worker
A background cron job runs every 15 minutes to reconcile stuck transactions:
*   Queries all payments in `PROCESSING` status that are older than 30 minutes.
*   Calls the provider's status API (`getPaymentStatus`) to check the true state of the payment.
*   If the provider marks the payment as successful, the worker manually triggers the fulfillment flow.
*   If the provider marks the payment as failed or expired, the worker updates the local payment status to `FAILED` or `EXPIRED`.

---

## Benefits of This Design
*   **High Concurrency**: Keeping transactions extremely short ensures database connections are released immediately, allowing the platform to handle high volumes of concurrent checkouts.
*   **Data Consistency**: The database is guaranteed to never contain orphaned orders or payments. Every successful payment is guaranteed to link to a valid, pre-existing order.
*   **Resilience**: The system can recover automatically from external network failures, API timeouts, and temporary database disconnects.
