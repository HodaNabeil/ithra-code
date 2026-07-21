import { randomUUID } from 'node:crypto';
import {
  createWebhookEventEntity,
  isOrderCompleted,
  isSuccessfulPayment,
  isTerminalPaymentStatus,
  type OrderEntity,
} from '@/features/payments/domain';
import type { ProcessWebhookRequest } from '../contracts/process-webhook.request';
import type { ProcessWebhookResponse } from '../contracts/process-webhook.response';
import type { OrderCompletedEvent } from '../events/order-completed.event';
import { WebhookError } from '../errors/webhook.errors';
import type {
  OrderCompletedPublisher,
  UnitOfWork,
} from '../ports';

export type ProcessWebhookUseCaseDeps = {
  unitOfWork: UnitOfWork;
  orderCompletedPublisher?: OrderCompletedPublisher;
};

/**
 * Processes a verified payment webhook.
 *
 * Critical path (single transaction):
 * 1. Persist WebhookEvent (idempotency via unique constraint)
 * 2. Mark payment succeeded/failed
 * 3. On success: complete order, enroll student, clear cart
 *
 * After commit, publishes `OrderCompleted` for secondary async work.
 * Duplicate deliveries return success without re-running fulfillment.
 */
export class ProcessWebhookUseCase {
  constructor(private readonly deps: ProcessWebhookUseCaseDeps) {}

  async execute(
    request: ProcessWebhookRequest,
  ): Promise<ProcessWebhookResponse> {
    try {
      const result = await this.deps.unitOfWork.execute(
        async ({
          webhookEvents,
          orders,
          payments,
          enrollments,
          carts,
        }) => {
          await webhookEvents.save(
            createWebhookEventEntity({
              provider: request.provider,
              type: request.type,
              providerEventId: request.providerEventId,
              payload: request.payload,
            }),
          );

          const order = await orders.findById(request.orderId);
          if (!order) {
            throw new WebhookError(
              404,
              'الطلب غير موجود',
              'ORDER_NOT_FOUND',
            );
          }

          if (!order.paymentId) {
            throw new WebhookError(
              404,
              'الدفعة غير موجودة',
              'PAYMENT_NOT_FOUND',
            );
          }

          const payment = await payments.findById(order.paymentId);
          if (!payment) {
            throw new WebhookError(
              404,
              'الدفعة غير موجودة',
              'PAYMENT_NOT_FOUND',
            );
          }

          // Already fulfilled — treat as idempotent success without side effects.
          if (
            isOrderCompleted(order) &&
            isSuccessfulPayment(payment)
          ) {
            return {
              duplicate: false,
              fulfilled: false,
              orderId: order.id,
              completedEvent: null as OrderCompletedEvent | null,
            };
          }

          if (request.outcome === 'failed') {
            if (!isTerminalPaymentStatus(payment.status)) {
              await payments.markFailed({
                paymentId: payment.id,
                providerTransactionId: request.providerTransactionId,
                failureCode: request.failureCode,
                failureMessage: request.failureMessage,
                providerMetadata: request.payload,
              });
            }

            return {
              duplicate: false,
              fulfilled: false,
              orderId: order.id,
              completedEvent: null as OrderCompletedEvent | null,
            };
          }

          await payments.markSucceeded({
            paymentId: payment.id,
            providerTransactionId: request.providerTransactionId,
            providerMetadata: request.payload,
            paymentMethod: request.paymentMethod,
            last4: request.last4,
            brand: request.brand,
            integrationId: request.integrationId,
          });

          await orders.markCompleted(order.id);

          const courseIds = order.items.map((item) => item.courseId);
          await enrollments.createActiveEnrollments(
            order.userId,
            courseIds,
          );
          await carts.clearForUser(order.userId);

          return {
            duplicate: false,
            fulfilled: true,
            orderId: order.id,
            completedEvent: this.buildOrderCompletedEvent(order, courseIds),
          };
        },
      );

      if (result.completedEvent && this.deps.orderCompletedPublisher) {
        // Secondary work must never fail the webhook / roll back fulfillment.
        try {
          await this.deps.orderCompletedPublisher.publish(
            result.completedEvent,
          );
        } catch {
          // Publisher failures are handled/logged by infrastructure workers;
          // enrollment and payment state already committed.
        }
      }

      return {
        duplicate: result.duplicate,
        fulfilled: result.fulfilled,
        orderId: result.orderId,
      };
    } catch (error) {
      if (this.isDuplicateWebhookError(error)) {
        return {
          duplicate: true,
          fulfilled: false,
          orderId: request.orderId,
        };
      }

      throw error;
    }
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

  private isDuplicateWebhookError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
