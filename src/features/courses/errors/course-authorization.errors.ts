/** Thrown by course authorization guards; route handlers map `status` to HTTP responses. */
export class CourseAuthorizationError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'CourseAuthorizationError';
  }
}

export const COURSE_OWNERSHIP_FORBIDDEN_MESSAGE =
  'You can only manage your own courses';
