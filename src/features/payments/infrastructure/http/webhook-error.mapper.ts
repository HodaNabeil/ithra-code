import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { isWebhookError } from '@/features/payments/application/errors/webhook.errors';

/**
 * Translates webhook errors into HTTP responses at the API boundary.
 * Duplicate deliveries are handled by the use case (returns 200), so they
 * never reach this mapper as errors.
 */
export function toWebhookHttpErrorResponse(
  error: unknown,
  context: string,
): NextResponse {
  if (isWebhookError(error)) {
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
