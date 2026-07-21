export type CheckoutErrorCode =
  | 'UNAUTHORIZED'
  | 'CART_NOT_FOUND'
  | 'EMPTY_CART'
  | 'COURSE_NOT_FOUND'
  | 'COURSE_NOT_PUBLISHED'
  | 'ALREADY_ENROLLED'
  | 'OWN_COURSE'
  | 'INVALID_COUPON'
  | 'UNSUPPORTED_CURRENCY'
  | 'UNSUPPORTED_PROVIDER'
  | 'PROVIDER_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED';

/** Thrown by checkout application services; presentation maps to HTTP responses. */
export class CheckoutError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: CheckoutErrorCode,
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}

export function isCheckoutError(error: unknown): error is CheckoutError {
  return error instanceof CheckoutError;
}
