# 06 - Repository Layer Specification

## Purpose
This document defines the architectural standards, design philosophy, and implementation rules for the Repository Layer within the IthraCode Payment Platform. It explains the mapping strategies, transaction rules, responsibilities, and anti-patterns to ensure complete isolation between the core business logic and the database persistence layer.

---

## Overview
The Repository Layer acts as an abstraction barrier between the core Domain/Application layers and the underlying database engine (PostgreSQL managed via Prisma). It encapsulates all data access, querying, and persistence operations behind clean, technology-agnostic interfaces.

---

## Repository Philosophy

### 1. Separation of Concerns
The core Domain and Application layers must remain completely unaware of the database engine, ORM, or SQL schema. They interact exclusively with abstract repository interfaces (e.g., `OrderRepository`). The concrete implementation (e.g., `PrismaOrderRepository`) lives entirely in the Infrastructure layer.

### 2. Why Repositories Never Contain Business Logic
Repositories are strictly data access components. They are responsible for retrieving data from the database, mapping it to rich domain entities, and saving those entities back to the database. 

Enforcing this rule prevents several critical architectural issues:
*   **Anemic Domain Model**: Placing business logic in repositories strips domain entities of their behavior, leading to a codebase where business rules are scattered across various database query files.
*   **Testing Complexity**: If a repository contains business rules, testing those rules requires mocking database connections or spinning up a database container, making unit tests slow and fragile.
*   **Maintenance Overhead**: Changing a business rule should never require modifying a database query file. Keeping them separate ensures that changes to database schemas do not leak into business logic.

---

## Repository Responsibilities
The Repository Layer is responsible for:
1.  **Data Retrieval**: Querying the database to fetch records by ID, unique identifiers, or specific criteria.
2.  **State Persistence**: Inserting new records or updating existing records to match the current state of the Domain Entity.
3.  **Data Mapping**: Translating raw database rows or ORM models into rich Domain Entities, and vice versa.
4.  **Transaction Context Propagation**: Accepting and executing queries within an active database transaction context when provided by the Unit of Work.

---

## Non-Responsibilities
The Repository Layer is explicitly NOT responsible for:
1.  **Business Validation**: It does not check if a user is eligible to buy a course, if a coupon is valid, or if a payment amount is correct.
2.  **State Transition Rules**: It does not decide when an order status changes from `PENDING` to `COMPLETED`; it simply saves the status provided by the entity.
3.  **External Communication**: It must never make HTTP requests, send emails, or publish events to message queues.
4.  **Orchestrating Multiple Entities**: It does not coordinate operations across different aggregates (e.g., saving an Order and updating a Cart). That is the responsibility of the Application Use Case.

---

## Repository Interfaces & Prisma Implementations

```
┌────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                      │
│                                                        │
│   export interface OrderRepository {                   │
│     findById(id: string): Promise<OrderEntity | null>; │
│     save(order: OrderEntity): Promise<OrderEntity>;    │
│   }                                                    │
└──────────────────────────▲─────────────────────────────┘
                           │ (Implements)
                           │
┌──────────────────────────┴─────────────────────────────┐
│                  INFRASTRUCTURE LAYER                  │
│                                                        │
│   export class PrismaOrderRepository                   │
│     implements OrderRepository {                       │
│       // Uses PrismaClient to read/write               │
│     }                                                  │
└────────────────────────────────────────────────────────┘
```

---

## Data Mapping Strategy
To maintain strict separation of concerns, the Infrastructure layer implements dedicated Mapper classes. Domain Entities and Prisma Models are kept completely distinct.

### Why Separate Models?
*   **Domain Entities**: Optimized for business logic, encapsulation, and domain invariants. They use rich types, value objects, and domain methods.
*   **Prisma Models**: Optimized for database schema design, indexing, relationships, and performance. They are dictated by database constraints and ORM requirements.

### Mapping Flow

```
Database Row  ──►  Prisma Model  ──►  [Mapper]  ──►  Domain Entity  (Inward Flow)
Domain Entity ──►  [Mapper]  ──►  Prisma Model  ──►  Database Row  (Outward Flow)
```

### Example Mapper Implementation

```typescript
export class OrderMapper {
  static toDomain(prismaOrder: PrismaOrderWithItems): OrderEntity {
    return {
      id: prismaOrder.id,
      orderNumber: prismaOrder.orderNumber,
      userId: prismaOrder.userId,
      subtotalCents: prismaOrder.subtotalCents,
      discountCents: prismaOrder.discountCents,
      taxCents: prismaOrder.taxCents,
      totalCents: prismaOrder.totalCents,
      currency: prismaOrder.currency,
      status: prismaOrder.status,
      couponId: prismaOrder.couponId,
      couponCode: prismaOrder.couponCode,
      paymentId: prismaOrder.paymentId,
      createdAt: prismaOrder.createdAt,
      updatedAt: prismaOrder.updatedAt,
      completedAt: prismaOrder.completedAt,
      items: prismaOrder.items.map(item => ({
        id: item.id,
        orderId: item.orderId,
        courseId: item.courseId,
        priceCents: item.priceCents,
        currency: item.currency,
        status: item.status,
        refundedAt: item.refundedAt,
      })),
    };
  }

  static toPrisma(domainOrder: OrderEntity) {
    return {
      id: domainOrder.id,
      orderNumber: domainOrder.orderNumber,
      userId: domainOrder.userId,
      subtotalCents: domainOrder.subtotalCents,
      discountCents: domainOrder.discountCents,
      taxCents: domainOrder.taxCents,
      totalCents: domainOrder.totalCents,
      currency: domainOrder.currency,
      status: domainOrder.status,
      couponId: domainOrder.couponId,
      couponCode: domainOrder.couponCode,
      paymentId: domainOrder.paymentId,
      createdAt: domainOrder.createdAt,
      updatedAt: domainOrder.updatedAt,
      completedAt: domainOrder.completedAt,
    };
  }
}
```

---

## Transaction Rules for Repositories
1.  **Optional Transaction Client**: Every write operation (`save`, `delete`, `update`) in a repository must accept an optional `txClient` parameter.
2.  **Client Resolution**: If `txClient` is provided, the repository must execute its queries using that client. If not, it must fall back to the standard, non-transactional database client.
3.  **No Self-Committing Transactions**: A repository must never open, commit, or roll back a transaction itself. Transaction boundaries are strictly managed by the Unit of Work.

---

## Anti-Patterns to Avoid
*   **Leakage of Prisma Types**: Repositories must never return Prisma-generated types (e.g., `Prisma.OrderGetPayload`) to the application or domain layers. They must always map data to Domain Entities.
*   **Direct Repository-to-Repository Calls**: Repositories must never import or call other repositories. If an operation requires multiple repositories, it must be orchestrated by an Application Use Case.
*   **Lazy Loading Outside Repositories**: All relations required by the domain (e.g., loading `OrderItems` with an `Order`) must be eagerly loaded inside the repository and mapped. Accessing database relations lazily in the application layer violates the boundary.
*   **Raw SQL Queries for Business Rules**: Avoid writing complex raw SQL queries that calculate discounts or validate states inside the repository. Calculations belong in Domain Services.
