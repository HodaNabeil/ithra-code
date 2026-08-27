export type ContactErrorCode =
  | 'VALIDATION_ERROR'
  | 'SECURITY_VERIFICATION_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

export const CONTACT_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SECURITY_VERIFICATION_FAILED: 'SECURITY_VERIFICATION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const satisfies Record<string, ContactErrorCode>;

export class ContactError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: ContactErrorCode,
  ) {
    super(message);
    this.name = 'ContactError';
  }
}

export function isContactError(error: unknown): error is ContactError {
  return error instanceof ContactError;
}
