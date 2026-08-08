import { isAxiosError } from 'axios';
import { logger } from '@/lib/logger';

export type HttpRetryConfig = {
  maxAttempts: number;
  initialDelayMs: number;
  jitterMs?: number;
};

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNABORTED',
]);

export function isRetryableHttpError(error: unknown): boolean {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status != null && RETRYABLE_STATUS_CODES.has(status)) {
      return true;
    }

    const code = error.code;
    if (code && RETRYABLE_ERROR_CODES.has(code)) {
      return true;
    }
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries transient HTTP failures with exponential backoff and jitter.
 */
export async function executeWithHttpRetry<T>(
  operation: () => Promise<T>,
  config: HttpRetryConfig,
  context: Record<string, unknown>,
): Promise<T> {
  const jitterMs = config.jitterMs ?? 100;
  let delayMs = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const canRetry =
        attempt < config.maxAttempts && isRetryableHttpError(error);

      if (!canRetry) {
        throw error;
      }

      const jitter = Math.floor(Math.random() * jitterMs * 2) - jitterMs;
      const waitMs = Math.max(0, delayMs + jitter);

      logger.warn(
        {
          ...context,
          attempt,
          maxAttempts: config.maxAttempts,
          delayMs: waitMs,
          status: isAxiosError(error) ? error.response?.status : undefined,
          code: isAxiosError(error) ? error.code : undefined,
        },
        '[PAYMOB_RETRY]',
      );

      await sleep(waitMs);
      delayMs *= 2;
    }
  }

  throw new Error('executeWithHttpRetry exhausted attempts');
}
