import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { env } from '@/config';
import { logger } from '@/lib/logger';
import { resolveCorrelationId } from '@/lib/observability/correlation-id';
import {
  mergePaymentTrace,
  runWithPaymentTrace,
} from '@/lib/observability/payment-trace';
import { paymentLogger } from '@/lib/observability/payment-logger';
import { loggingMetricsRecorder } from '@/features/payments/infrastructure/observability/logging-metrics.recorder';
import { WebhookReplayGuard } from '@/features/payments/application/services/webhook-replay.guard';
import { createProcessWebhookUseCase } from '@/features/payments/infrastructure/di/payments.container';
import { mapPaymobWebhookToProcessRequest } from '@/features/payments/infrastructure/gateways/paymob/paymob-webhook.mapper';
import { readPaymobConfig } from '@/features/payments/infrastructure/gateways/paymob/paymob.config';
import { verifyPaymobTransactionHmac } from '@/features/payments/infrastructure/gateways/paymob/paymob.hmac';
import {
  checkWebhookRateLimit,
  getClientIp,
} from '@/features/payments/infrastructure/http/rate-limit';
import { toWebhookHttpErrorResponse } from '@/features/payments/infrastructure/http/webhook-error.mapper';
import { WebhookError } from '@/features/payments/application/errors/webhook.errors';

/**
 * Paymob processed-transaction webhook.
 *
 * Raw body is preserved for HMAC verification. Signature is read from the
 * `hmac` query parameter (Paymob convention). The client redirect is never
 * trusted — this endpoint is the source of truth for fulfillment.
 */
export async function POST(req: Request) {
  const correlationId = resolveCorrelationId(req);
  const startedAt = Date.now();

  return runWithPaymentTrace(
    { traceId: randomUUID(), correlationId },
    async () => {
      try {
        await checkWebhookRateLimit(getClientIp(req));

        const config = readPaymobConfig();
        if (!config) {
          throw new WebhookError(
            503,
            'مزود الدفع غير متاح حالياً',
            'PROVIDER_UNAVAILABLE',
          );
        }

        const rawBody = await req.text();
        const url = new URL(req.url);
        const receivedHmac = url.searchParams.get('hmac') ?? '';

        if (!receivedHmac) {
          throw new WebhookError(
            401,
            'توقيع إشعار الدفع مفقود',
            'INVALID_SIGNATURE',
          );
        }

        let payload: unknown;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          throw new WebhookError(
            400,
            'صيغة إشعار الدفع غير صالحة',
            'VALIDATION_ERROR',
          );
        }

        const { request, transaction, eventCreatedAt } =
          mapPaymobWebhookToProcessRequest({
            payload,
            hmac: receivedHmac,
          });

        const valid = verifyPaymobTransactionHmac({
          transaction,
          receivedHmac,
          hmacSecret: config.hmacSecret,
        });

        if (!valid) {
          logger.warn(
            { providerEventId: request.providerEventId },
            '[PAYMOB_WEBHOOK_INVALID_HMAC]',
          );
          throw new WebhookError(
            401,
            'توقيع إشعار الدفع غير صالح',
            'INVALID_SIGNATURE',
          );
        }

        const replayGuard = new WebhookReplayGuard(
          env.PAYMOB_WEBHOOK_REPLAY_WINDOW_SECONDS,
        );
        replayGuard.assertFresh({ eventCreatedAt });

        const useCase = createProcessWebhookUseCase();
        const result = await useCase.execute(request);

        mergePaymentTrace({ orderId: result.orderId });

        loggingMetricsRecorder.incrementCounter('payment_webhook_processed', {
          duplicate: Boolean(result.duplicate),
          fulfilled: Boolean(result.fulfilled),
        });
        loggingMetricsRecorder.observeHistogram(
          'payment_webhook_duration_ms',
          Date.now() - startedAt,
        );

        paymentLogger.info(
          {
            orderId: result.orderId,
            duplicate: result.duplicate,
            fulfilled: result.fulfilled,
            providerEventId: request.providerEventId,
          },
          '[PAYMOB_WEBHOOK_PROCESSED]',
        );

        return NextResponse.json(
          { ok: true, ...result },
          {
            status: 200,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      } catch (error) {
        loggingMetricsRecorder.incrementCounter('payment_webhook_error');
        return toWebhookHttpErrorResponse(error, '[PAYMOB_WEBHOOK_ERROR]');
      }
    },
  );
}
