/**
 * Base platform error types and codes.
 */

export const PlatformErrorCodes = {
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  AI_DISABLED: 'AI_DISABLED',
  RATE_LIMITED: 'RATE_LIMITED',
  COST_CAP_EXCEEDED: 'COST_CAP_EXCEEDED',
  CONCURRENCY_LIMIT: 'CONCURRENCY_LIMIT',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RUNTIME_ERROR: 'RUNTIME_ERROR',
} as const;

export type PlatformErrorCode =
  (typeof PlatformErrorCodes)[keyof typeof PlatformErrorCodes];

export class PlatformError extends Error {
  constructor(
    public readonly code: PlatformErrorCode,
    message: string,
    public readonly retryable = false,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}
