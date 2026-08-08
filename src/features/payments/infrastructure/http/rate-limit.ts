import { redis } from '@/lib/redis';
import { CheckoutError } from '@/features/payments/application';
import { WebhookError } from '@/features/payments/application/errors/webhook.errors';

const CHECKOUT_USER_PREFIX = 'rate:payment-checkout:user';
const CHECKOUT_IP_PREFIX = 'rate:payment-checkout:ip';
const WEBHOOK_IP_PREFIX = 'rate:payment-webhook:ip';

const CHECKOUT_USER_MAX = 5;
const CHECKOUT_USER_WINDOW_SECONDS = 60;
const CHECKOUT_IP_MAX = 10;
const CHECKOUT_IP_WINDOW_SECONDS = 60;
const WEBHOOK_IP_MAX = 120;
const WEBHOOK_IP_WINDOW_SECONDS = 1;

async function incrementWindow(
  key: string,
  windowSeconds: number,
): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count;
}

/**
 * Checkout abuse protection: 5 req/user/min and 10 req/IP/min.
 * Redis failures are swallowed so rate limiting never blocks legitimate checkout.
 */
export async function checkCheckoutRateLimit(input: {
  userId: string;
  ip: string | null;
}): Promise<void> {
  try {
    const userCount = await incrementWindow(
      `${CHECKOUT_USER_PREFIX}:${input.userId}`,
      CHECKOUT_USER_WINDOW_SECONDS,
    );

    if (userCount > CHECKOUT_USER_MAX) {
      throw new CheckoutError(
        429,
        'تم تجاوز حد طلبات الدفع. حاول مرة أخرى لاحقاً',
        'RATE_LIMIT_EXCEEDED',
      );
    }

    if (input.ip) {
      const ipCount = await incrementWindow(
        `${CHECKOUT_IP_PREFIX}:${input.ip}`,
        CHECKOUT_IP_WINDOW_SECONDS,
      );

      if (ipCount > CHECKOUT_IP_MAX) {
        throw new CheckoutError(
          429,
          'تم تجاوز حد طلبات الدفع. حاول مرة أخرى لاحقاً',
          'RATE_LIMIT_EXCEEDED',
        );
      }
    }
  } catch (error) {
    if (error instanceof CheckoutError) {
      throw error;
    }
  }
}

/**
 * Webhook throughput guard (~120 req/s per IP). Failures are ignored so a
 * Redis outage cannot cause provider retries to pile up indefinitely.
 */
export async function checkWebhookRateLimit(
  ip: string | null,
): Promise<void> {
  if (!ip) return;

  try {
    const count = await incrementWindow(
      `${WEBHOOK_IP_PREFIX}:${ip}`,
      WEBHOOK_IP_WINDOW_SECONDS,
    );

    if (count > WEBHOOK_IP_MAX) {
      throw new WebhookError(
        429,
        'Too many webhook requests',
        'VALIDATION_ERROR',
      );
    }
  } catch (error) {
    if (error instanceof WebhookError) {
      throw error;
    }
  }
}

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }

  return req.headers.get('x-real-ip');
}
