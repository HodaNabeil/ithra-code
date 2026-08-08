import {
  createWebhookEventEntity,
} from '@/features/payments/domain';
import type { ProcessWebhookRequest } from '../contracts/process-webhook.request';
import type { ProcessWebhookResponse } from '../contracts/process-webhook.response';
import { WebhookError } from '../errors/webhook.errors';
import type { OrderCompletedPublisher, UnitOfWork } from '../ports';
import { FulfillOrderService } from '../services/fulfill-order.service';
import { assertWebhookSuccessMatchesPayment } from '../services/reconciliation-provider-outcome.validator';

export type ProcessWebhookUseCaseDeps = {
  unitOfWork: UnitOfWork;
  fulfillOrderService: FulfillOrderService;
  orderCompletedPublisher?: OrderCompletedPublisher;
};

/**
 * Processes a verified payment webhook.
 *
 * Critical path (single transaction):
 * 1. Persist WebhookEvent (idempotency via unique constraint)
 * 2. Delegate fulfillment to FulfillOrderService within the same transaction
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
        async (repositories) => {
          await repositories.webhookEvents.save(
            createWebhookEventEntity({
              provider: request.provider,
              type: request.type,
              providerEventId: request.providerEventId,
              payload: request.payload,
            }),
          );

          const order = await repositories.orders.findById(request.orderId);
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

          const payment = await repositories.payments.findById(order.paymentId);
          if (!payment) {
            throw new WebhookError(
              404,
              'الدفعة غير موجودة',
              'PAYMENT_NOT_FOUND',
            );
          }

          assertWebhookSuccessMatchesPayment(request, payment);

          return this.deps.fulfillOrderService.fulfillWithRepositories(
            repositories,
            {
              orderId: request.orderId,
              outcome:
                request.outcome === 'succeeded' ? 'succeeded' : 'failed',
              providerTransactionId: request.providerTransactionId,
              providerMetadata: request.payload,
              paymentMethod: request.paymentMethod,
              last4: request.last4,
              brand: request.brand,
              integrationId: request.integrationId,
              failureCode: request.failureCode,
              failureMessage: request.failureMessage,
            },
          );
        },
      );

      if (result.completedEvent && this.deps.orderCompletedPublisher) {
        try {
          await this.deps.orderCompletedPublisher.publish(
            result.completedEvent,
          );
        } catch {
          // Publisher failures must never roll back enrollment.
        }
      }

      return {
        duplicate: false,
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

  private isDuplicateWebhookError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
