import { randomUUID } from 'node:crypto';
import {
  isOrderCompleted,
  isSuccessfulPayment,
  isTerminalPaymentStatus,
  type OrderEntity,
} from '@/features/payments/domain';
import type { OrderCompletedEvent } from '../events/order-completed.event';
import type { TransactionalRepositories, UnitOfWork } from '../ports';

export type FulfillPaymentInput = {
  orderId: string;
  outcome: 'succeeded' | 'failed';
  providerTransactionId?: string | null;
  providerMetadata?: unknown;
  paymentMethod?: string | null;
  last4?: string | null;
  brand?: string | null;
  integrationId?: number | null;
  failureCode?: string | null;
  failureMessage?: string | null;
};

export type FulfillOrderResult = {
  fulfilled: boolean;
  orderId: string;
  completedEvent: OrderCompletedEvent | null;
};

type FulfillmentRepos = Pick<
  TransactionalRepositories,
  'orders' | 'payments' | 'enrollments' | 'carts'
>;

/**
 * Shared transactional fulfillment used by webhooks and reconciliation.
 * Idempotent: already-completed orders return without side effects.
 */
export class FulfillOrderService {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async fulfill(input: FulfillPaymentInput): Promise<FulfillOrderResult> {
    return this.unitOfWork.execute((repos) =>
      this.fulfillWithRepositories(repos, input),
    );
  }

  async fulfillWithRepositories(
    repos: FulfillmentRepos,
    input: FulfillPaymentInput,
  ): Promise<FulfillOrderResult> {
    const order = await repos.orders.findById(input.orderId);
    if (!order) {
      throw new Error(`Order not found: ${input.orderId}`);
    }

    if (!order.paymentId) {
      throw new Error(`Order ${input.orderId} has no linked payment`);
    }

    const payment = await repos.payments.findById(order.paymentId);
    if (!payment) {
      throw new Error(`Payment not found for order ${input.orderId}`);
    }

    if (isOrderCompleted(order) && isSuccessfulPayment(payment)) {
      return {
        fulfilled: false,
        orderId: order.id,
        completedEvent: null,
      };
    }

    if (input.outcome === 'failed') {
      if (!isTerminalPaymentStatus(payment.status)) {
        await repos.payments.markFailed({
          paymentId: payment.id,
          providerTransactionId: input.providerTransactionId,
          failureCode: input.failureCode,
          failureMessage: input.failureMessage,
          providerMetadata: input.providerMetadata,
        });
      }

      return {
        fulfilled: false,
        orderId: order.id,
        completedEvent: null,
      };
    }

    if (isTerminalPaymentStatus(payment.status)) {
      if (!isSuccessfulPayment(payment)) {
        return {
          fulfilled: false,
          orderId: order.id,
          completedEvent: null,
        };
      }

      if (isOrderCompleted(order)) {
        return {
          fulfilled: false,
          orderId: order.id,
          completedEvent: null,
        };
      }

      await repos.orders.markCompleted(order.id);

      const courseIds = order.items.map((item) => item.courseId);
      await repos.enrollments.createActiveEnrollments(order.userId, courseIds);
      await repos.carts.clearForUser(order.userId);

      return {
        fulfilled: true,
        orderId: order.id,
        completedEvent: this.buildOrderCompletedEvent(order, courseIds),
      };
    }

    const markedSucceeded = await repos.payments.markSucceeded({
      paymentId: payment.id,
      providerTransactionId: this.requireProviderTransactionId(
        input,
        payment.providerTransactionId,
        input.orderId,
      ),
      providerMetadata: input.providerMetadata,
      paymentMethod: input.paymentMethod,
      last4: input.last4,
      brand: input.brand,
      integrationId: input.integrationId,
    });

    if (!markedSucceeded) {
      const refreshed = await repos.payments.findById(payment.id);
      if (!refreshed || !isSuccessfulPayment(refreshed)) {
        return {
          fulfilled: false,
          orderId: order.id,
          completedEvent: null,
        };
      }

      if (isOrderCompleted(order)) {
        return {
          fulfilled: false,
          orderId: order.id,
          completedEvent: null,
        };
      }
    }

    await repos.orders.markCompleted(order.id);

    const courseIds = order.items.map((item) => item.courseId);
    await repos.enrollments.createActiveEnrollments(order.userId, courseIds);
    await repos.carts.clearForUser(order.userId);

    return {
      fulfilled: true,
      orderId: order.id,
      completedEvent: this.buildOrderCompletedEvent(order, courseIds),
    };
  }

  private buildOrderCompletedEvent(
    order: OrderEntity,
    courseIds: string[],
  ): OrderCompletedEvent {
    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      orderId: order.id,
      userId: order.userId,
      totalCents: order.totalCents,
      currency: order.currency,
      purchasedCourseIds: courseIds,
    };
  }

  private requireProviderTransactionId(
    input: FulfillPaymentInput,
    existing: string | null,
    orderId: string,
  ): string {
    const txnId = input.providerTransactionId ?? existing;
    if (!txnId?.trim()) {
      throw new Error(
        `Cannot fulfill success without providerTransactionId for order ${orderId}`,
      );
    }

    return txnId;
  }
}
