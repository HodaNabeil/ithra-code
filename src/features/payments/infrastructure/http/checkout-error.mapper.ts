import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { isCheckoutError } from '@/features/payments/application';

/**
 * Translates thrown errors into HTTP responses at the API boundary.
 * `CheckoutError` carries a status code and a machine-readable code; anything
 * else is treated as an unexpected internal error.
 */
export function toHttpErrorResponse(
  error: unknown,
  context: string,
): NextResponse {
  if (isCheckoutError(error)) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  logger.error({ error }, context);

  return NextResponse.json(
    { error: 'Internal Error', code: 'INTERNAL_ERROR' },
    { status: 500 },
  );
}
