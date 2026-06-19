/** Thrown by course-overview use-case; route handler maps `status` to HTTP responses. */
export class CourseOverviewError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'CourseOverviewError';
  }
}

export const COURSE_NOT_FOUND_MESSAGE = 'Course not found';
