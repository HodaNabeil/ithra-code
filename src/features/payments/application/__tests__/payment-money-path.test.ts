import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';
import type {
  OrderEntity,
  PaymentEntity,
  WebhookEventEntity,
} from '@/features/payments/domain';
import { FULFILLABLE_PAYMENT_STATUSES } from '@/features/payments/domain';
import type {
  MarkPaymentFailedInput,
  MarkPaymentSucceededInput,
  PaymentRepository,
  RecordReconcileAttemptInput,
  TransactionalRepositories,
  UnitOfWork,
} from '@/features/payments/application/ports';
import { WebhookError } from '@/features/payments/application/errors/webhook.errors';
import { FulfillOrderService } from '@/features/payments/application/services/fulfill-order.service';
import {
  assertWebhookSuccessMatchesPayment,
  normalizeProviderOutcomeForReconcile,
} from '@/features/payments/application/services/reconciliation-provider-outcome.validator';
import { ReconciliationPolicy } from '@/features/payments/application/services/reconciliation-policy.service';
import { ProcessWebhookUseCase } from '@/features/payments/application/use-cases/process-webhook.use-case';

function createPayment(overrides: Partial<PaymentEntity> = {}): PaymentEntity {
  const now = new Date();
  return {
    id: overrides.id ?? randomUUID(),
    provider: 'PAYMOB',
    providerTransactionId: overrides.providerTransactionId ?? null,
    providerMetadata: null,
    amountCents: overrides.amountCents ?? 10_000,
    currency: overrides.currency ?? 'EGP',
    status: overrides.status ?? 'PROCESSING',
    paymentMethod: null,
    integrationId: null,
    last4: null,
    brand: null,
    failureCode: null,
    failureMessage: null,
    reconcileStatus: 'SCHEDULED',
    reconcileAttemptCount: 0,
    consecutiveNotFoundCount: 0,
    nextReconcileAt: null,
    reconcileLeaseExpiresAt: null,
    lastReconciledAt: null,
    lastProviderOutcome: null,
    lastProviderDetail: null,
    createdAt: now,
    updatedAt: now,
    paidAt: null,
    ...overrides,
  };
}

function createOrder(
  payment: PaymentEntity,
  overrides: Partial<OrderEntity> = {},
): OrderEntity {
  return {
    id: overrides.id ?? randomUUID(),
    orderNumber: overrides.orderNumber ?? `ORD-${randomUUID()}`,
    userId: overrides.userId ?? randomUUID(),
    subtotalCents: payment.amountCents,
    discountCents: 0,
    taxCents: 0,
    totalCents: payment.amountCents,
    currency: payment.currency,
    status: overrides.status ?? 'PENDING',
    couponId: null,
    couponCode: null,
    checkoutFingerprint: null,
    paymentId: payment.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    items: overrides.items ?? [
      {
        id: randomUUID(),
        orderId: overrides.id ?? randomUUID(),
        courseId: randomUUID(),
        priceCents: payment.amountCents,
        currency: payment.currency,
        status: 'ACTIVE',
        refundedAt: null,
      },
    ],
    ...overrides,
  };
}

class InMemoryPaymentRepository implements PaymentRepository {
  constructor(private readonly payments: Map<string, PaymentEntity>) {}

  async save(payment: PaymentEntity): Promise<PaymentEntity> {
    this.payments.set(payment.id, payment);
    return payment;
  }

  async findById(paymentId: string): Promise<PaymentEntity | null> {
    return this.payments.get(paymentId) ?? null;
  }

  async markProcessing(): Promise<void> {}

  async markProcessingAndScheduleReconcile(): Promise<void> {}

  async markSucceeded(input: MarkPaymentSucceededInput): Promise<boolean> {
    const payment = this.payments.get(input.paymentId);
    if (!payment || !FULFILLABLE_PAYMENT_STATUSES.includes(payment.status)) {
      return false;
    }

    this.payments.set(input.paymentId, {
      ...payment,
      status: 'SUCCEEDED',
      providerTransactionId: input.providerTransactionId,
      paidAt: new Date(),
      reconcileStatus: 'IDLE',
      nextReconcileAt: null,
    });
    return true;
  }

  async markFailed(input: MarkPaymentFailedInput): Promise<boolean> {
    const payment = this.payments.get(input.paymentId);
    if (!payment || !FULFILLABLE_PAYMENT_STATUSES.includes(payment.status)) {
      return false;
    }

    this.payments.set(input.paymentId, {
      ...payment,
      status: 'FAILED',
      reconcileStatus: 'IDLE',
      nextReconcileAt: null,
      failureCode: input.failureCode ?? null,
      failureMessage: input.failureMessage ?? null,
    });
    return true;
  }

  async findStaleForReconciliation() {
    return [];
  }

  async claimDueForReconciliation() {
    return [];
  }

  async findReconciliationContext() {
    return null;
  }

  async recordReconcileAttempt(input: RecordReconcileAttemptInput): Promise<void> {
    const payment = this.payments.get(input.paymentId);
    if (!payment) return;
    this.payments.set(input.paymentId, {
      ...payment,
      reconcileAttemptCount: input.attempt,
      reconcileStatus: input.reconcileStatus,
      nextReconcileAt: input.nextReconcileAt,
      reconcileLeaseExpiresAt: null,
    });
  }

  async scheduleReconcile(): Promise<void> {}
}

class InMemoryOrderRepository {
  constructor(private readonly orders: Map<string, OrderEntity>) {}

  async findById(orderId: string): Promise<OrderEntity | null> {
    return this.orders.get(orderId) ?? null;
  }

  async markCompleted(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;
    this.orders.set(orderId, {
      ...order,
      status: 'COMPLETED',
      completedAt: new Date(),
    });
  }

  async save(): Promise<OrderEntity> {
    throw new Error('not implemented');
  }

  async findReusablePendingOrder(): Promise<null> {
    return null;
  }
}

class InMemoryWebhookEventRepository {
  private readonly events = new Map<string, WebhookEventEntity>();

  async save(event: WebhookEventEntity): Promise<WebhookEventEntity> {
    const key = `${event.provider}:${event.providerEventId}`;
    if (this.events.has(key)) {
      const error = new Error('duplicate webhook') as Error & { code?: string };
      error.code = 'P2002';
      throw error;
    }
    this.events.set(key, event);
    return event;
  }
}

class InMemoryEnrollmentRepository {
  readonly enrollments = new Set<string>();

  async createActiveEnrollments(userId: string, courseIds: string[]): Promise<void> {
    for (const courseId of courseIds) {
      this.enrollments.add(`${userId}:${courseId}`);
    }
  }
}

class InMemoryCartRepository {
  clearedUsers = new Set<string>();

  async clearForUser(userId: string): Promise<void> {
    this.clearedUsers.add(userId);
  }
}

function createUnitOfWork(input: {
  orders: Map<string, OrderEntity>;
  payments: Map<string, PaymentEntity>;
}): UnitOfWork {
  const paymentRepo = new InMemoryPaymentRepository(input.payments);
  const orderRepo = new InMemoryOrderRepository(input.orders);
  const webhookRepo = new InMemoryWebhookEventRepository();
  const enrollmentRepo = new InMemoryEnrollmentRepository();
  const cartRepo = new InMemoryCartRepository();

  return {
    execute: async <T>(
      work: (repositories: TransactionalRepositories) => Promise<T>,
    ) =>
      work({
        orders: orderRepo as TransactionalRepositories['orders'],
        payments: paymentRepo,
        webhookEvents: webhookRepo,
        enrollments: enrollmentRepo,
        carts: cartRepo,
        checkoutSessions: {} as TransactionalRepositories['checkoutSessions'],
      }),
  };
}

describe('payment money path', () => {
  it('fulfills success idempotently when order already completed', async () => {
    const payment = createPayment({
      status: 'SUCCEEDED',
      providerTransactionId: 'txn-1',
      paidAt: new Date(),
    });
    const order = createOrder(payment, { status: 'COMPLETED' });
    const payments = new Map([[payment.id, payment]]);
    const orders = new Map([[order.id, order]]);
    const service = new FulfillOrderService(createUnitOfWork({ orders, payments }));

    const result = await service.fulfill({
      orderId: order.id,
      outcome: 'succeeded',
      providerTransactionId: 'txn-1',
    });

    assert.equal(result.fulfilled, false);
    assert.equal(payments.get(payment.id)?.status, 'SUCCEEDED');
  });

  it('does not overwrite terminal failed payment on success fulfillment race', async () => {
    const payment = createPayment({ status: 'FAILED' });
    const order = createOrder(payment);
    const payments = new Map([[payment.id, payment]]);
    const orders = new Map([[order.id, order]]);
    const service = new FulfillOrderService(createUnitOfWork({ orders, payments }));

    const result = await service.fulfill({
      orderId: order.id,
      outcome: 'succeeded',
      providerTransactionId: 'txn-2',
    });

    assert.equal(result.fulfilled, false);
    assert.equal(payments.get(payment.id)?.status, 'FAILED');
    assert.equal(orders.get(order.id)?.status, 'PENDING');
  });

  it('rejects webhook success when amount mismatches payment', () => {
    assert.throws(
      () =>
        assertWebhookSuccessMatchesPayment(
          {
            provider: 'PAYMOB',
            providerEventId: 'evt-1',
            type: 'TRANSACTION',
            payload: {},
            outcome: 'succeeded',
            orderId: 'order-1',
            providerTransactionId: 'txn-1',
            amountCents: 5_000,
            currency: 'EGP',
          },
          { amountCents: 10_000, currency: 'EGP' },
        ),
      (error: unknown) =>
        error instanceof WebhookError && error.code === 'VALIDATION_ERROR',
    );
  });

  it('downgrades reconcile success with amount mismatch to ambiguous', () => {
    const normalized = normalizeProviderOutcomeForReconcile(
      {
        outcome: 'succeeded',
        providerTransactionId: 'txn-1',
        amountCents: 5_000,
        currency: 'EGP',
      },
      { amountCents: 10_000, currency: 'EGP' },
    );

    assert.equal(normalized.outcome, 'ambiguous');
    assert.equal(normalized.failureCode, 'AMOUNT_MISMATCH');
  });

  it('defers reconcile when provider outcome is pending', () => {
    const policy = new ReconciliationPolicy({
      maxAttempts: 5,
      maxWindowMs: 24 * 60 * 60 * 1000,
      backoffBaseMs: 60_000,
      backoffCapMs: 60 * 60 * 1000,
      abandonNotFoundCount: 3,
    });

    const decision = policy.decide({
      outcome: 'pending',
      attemptCount: 0,
      consecutiveNotFoundCount: 0,
      paymentCreatedAt: new Date(),
      sessionExpiresAt: new Date(Date.now() + 60_000),
      now: new Date(),
    });

    assert.equal(decision.type, 'defer');
  });

  it('treats duplicate webhook delivery as idempotent response', async () => {
    const payment = createPayment({
      providerTransactionId: 'txn-dup',
    });
    const order = createOrder(payment);
    const payments = new Map([[payment.id, payment]]);
    const orders = new Map([[order.id, order]]);
    const unitOfWork = createUnitOfWork({ orders, payments });
    const useCase = new ProcessWebhookUseCase({
      unitOfWork,
      fulfillOrderService: new FulfillOrderService(unitOfWork),
    });

    const request = {
      provider: 'PAYMOB' as const,
      providerEventId: 'TRANSACTION_txn-dup',
      type: 'TRANSACTION',
      payload: {},
      outcome: 'succeeded' as const,
      orderId: order.id,
      providerTransactionId: 'txn-dup',
      amountCents: payment.amountCents,
      currency: payment.currency,
    };

    const first = await useCase.execute(request);
    const second = await useCase.execute(request);

    assert.equal(first.duplicate, false);
    assert.equal(first.fulfilled, true);
    assert.equal(second.duplicate, true);
    assert.equal(orders.get(order.id)?.status, 'COMPLETED');
  });
});
