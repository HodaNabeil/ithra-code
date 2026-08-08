export type CartErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'COURSE_NOT_FOUND'
  | 'COURSE_NOT_PUBLISHED'
  | 'FREE_COURSE'
  | 'ALREADY_ENROLLED'
  | 'ALREADY_IN_CART'
  | 'CURRENCY_MISMATCH';

export const CART_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',
  FREE_COURSE: 'FREE_COURSE',
  ALREADY_ENROLLED: 'ALREADY_ENROLLED',
  ALREADY_IN_CART: 'ALREADY_IN_CART',
  CURRENCY_MISMATCH: 'CURRENCY_MISMATCH',
} as const satisfies Record<string, CartErrorCode>;

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

export function isCartErrorWithCode(
  error: unknown,
  code: CartErrorCode,
): error is CartError {
  return error instanceof CartError && error.code === code;
}

export function isCartErrorWithAnyCode(
  error: unknown,
  codes: ReadonlySet<CartErrorCode>,
): error is CartError {
  return error instanceof CartError && codes.has(error.code);
}

/** @deprecated Use CartError instead. Kept for GET/DELETE route compatibility. */
export class CartServiceError extends CartError {
  constructor(status: number, message: string) {
    super(status, message, 'VALIDATION_ERROR');
    this.name = 'CartServiceError';
  }
}
