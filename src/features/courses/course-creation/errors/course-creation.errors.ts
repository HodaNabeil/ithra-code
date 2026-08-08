/** Thrown by course-creation use-case; route handler maps `status` to HTTP responses. */
export class CourseCreationError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'CourseCreationError';
  }
}
