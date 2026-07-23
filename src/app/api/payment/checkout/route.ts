import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

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

    return NextResponse.json(
      {
        data: {
          redirectUrl: result.redirectUrl,
          expiresAt: result.expiresAt,
          checkoutSession: result.checkoutSession,
          clientSecret: result.clientSecret,
          publicKey: result.publicKey,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return toHttpErrorResponse(error, '[PAYMENT_CHECKOUT_ERROR]');
  }
}
