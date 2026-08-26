/** Thrown by path API use-cases; route handlers map `status` to HTTP responses. */
export class PathListError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'PathListError';
  }
}

export class PathDetailError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'PathDetailError';
  }
}

export const PATH_NOT_FOUND_MESSAGE = 'Path not found';
