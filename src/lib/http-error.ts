/**
 * Typed HTTP error thrown by httpServer when the backend returns a non-2xx status.
 * Server Actions map `status` to user-facing messages (401, 409, etc.).
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
