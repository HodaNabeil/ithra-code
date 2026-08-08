import { logger } from '@/lib/logger';

export function runTelemetrySafely<T>(
  operation: string,
  fn: () => T,
  fallback: T,
): T {
  try {
    return fn();
  } catch (error) {
    logger.warn({ error, operation }, '[OTEL] telemetry call failed');
    return fallback;
  }
}

export async function runTelemetrySafelyAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.warn({ error, operation }, '[OTEL] telemetry call failed');
    return fallback();
  }
}
