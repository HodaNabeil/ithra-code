export type CartErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'COURSE_NOT_FOUND'
  | 'COURSE_NOT_PUBLISHED'
  | 'FREE_COURSE'
  | 'ALREADY_ENROLLED'
  | 'ALREADY_IN_CART'
  | 'CURRENCY_MISMATCH';

/** Thrown by cart use-cases; route handlers map `status` and `code` to HTTP responses. */
export class CartError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: CartErrorCode,
  ) {
    super(message);
    this.name = 'CartError';
  }
}

/** @deprecated Use CartError instead. Kept for GET/DELETE route compatibility. */
export class CartServiceError extends CartError {
  constructor(status: number, message: string) {
    super(status, message, 'VALIDATION_ERROR');
    this.name = 'CartServiceError';
  }
}
