/** Thrown by course-progress use-case; route handler maps `status` to HTTP responses. */
export class CourseProgressError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'CourseProgressError';
  }
}
