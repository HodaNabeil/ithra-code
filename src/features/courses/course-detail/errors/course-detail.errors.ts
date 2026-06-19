/** Thrown by course-detail use-case; route handler maps `status` to HTTP responses. */
export class CourseDetailError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'CourseDetailError';
  }
}

export const COURSE_NOT_FOUND_MESSAGE = 'Course not found';
