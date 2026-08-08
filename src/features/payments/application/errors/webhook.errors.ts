export type WebhookErrorCode =
  | 'INVALID_SIGNATURE'
  | 'REPLAY_DETECTED'
  | 'DUPLICATE_EVENT'
  | 'ORDER_NOT_FOUND'
  | 'PAYMENT_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'PROVIDER_UNAVAILABLE';

/** Thrown by webhook application services; presentation maps to HTTP responses. */
export class WebhookError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: WebhookErrorCode,
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

export function isWebhookError(error: unknown): error is WebhookError {
  return error instanceof WebhookError;
}
