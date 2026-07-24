import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { resolveCorrelationId } from '@/lib/observability/correlation-id';
import { mergePaymentTrace, runWithPaymentTrace } from '@/lib/observability/payment-trace';
import { paymentLogger } from '@/lib/observability/payment-logger';
import { loggingMetricsRecorder } from '@/features/payments/infrastructure/observability/logging-metrics.recorder';
import type { PaymentProvider } from '@/features/payments/domain';
import { createCheckoutUseCase } from '@/features/payments/infrastructure/di/payments.container';
import { toHttpErrorResponse } from '@/features/payments/infrastructure/http/checkout-error.mapper';
import {
  checkCheckoutRateLimit,
  getClientIp,
} from '@/features/payments/infrastructure/http/rate-limit';

const checkoutSchema = z.object({
  provider: z.enum(['PAYMOB', 'STRIPE', 'PAYPAL', 'CASH']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function POST(req: Request) {
  const correlationId = resolveCorrelationId(req);
  const startedAt = Date.now();

  return runWithPaymentTrace(
    { traceId: randomUUID(), correlationId },
    async () => {
      try {
        const session = await auth();
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: 'Unauthorized', code: 'UNAUTHORIZED' },
            { status: 401 },
          );
        }

        mergePaymentTrace({ userId: session.user.id });

        await checkCheckoutRateLimit({
          userId: session.user.id,
          ip: getClientIp(req),
        });

        const json = await req.json().catch(() => null);
        const parsed = checkoutSchema.safeParse(json);

        if (!parsed.success) {
          return NextResponse.json(
            {
              error: 'Invalid request payload',
              code: 'VALIDATION_ERROR',
              details: parsed.error.flatten(),
            },
            { status: 400 },
          );
        }

        const useCase = createCheckoutUseCase();
        const result = await useCase.execute({
          userId: session.user.id,
          provider: parsed.data.provider as PaymentProvider,
          successUrl: parsed.data.successUrl,
          cancelUrl: parsed.data.cancelUrl,
        });

        mergePaymentTrace({ orderId: result.checkoutSession.orderId });

        loggingMetricsRecorder.incrementCounter('payment_checkout_success', {
          provider: parsed.data.provider,
          reused: Boolean(result.reused),
        });
        loggingMetricsRecorder.observeHistogram(
          'payment_checkout_duration_ms',
          Date.now() - startedAt,
          { provider: parsed.data.provider },
        );

        paymentLogger.info(
          {
            orderId: result.checkoutSession.orderId,
            reused: result.reused ?? false,
          },
          '[PAYMENT_CHECKOUT_COMPLETED]',
        );

        return NextResponse.json(
          {
            data: {
              redirectUrl: result.redirectUrl,
              expiresAt: result.expiresAt,
              checkoutSession: result.checkoutSession,
              clientSecret: result.clientSecret,
              publicKey: result.publicKey,
              reused: result.reused ?? false,
            },
          },
          {
            status: 201,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      } catch (error) {
        loggingMetricsRecorder.incrementCounter('payment_checkout_error');
        return toHttpErrorResponse(error, '[PAYMENT_CHECKOUT_ERROR]');
      }
    },
  );
}
