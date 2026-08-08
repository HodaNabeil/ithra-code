/** Thrown by archive-course use-case; route handler maps `status` to HTTP responses. */
export class ArchiveCourseError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ArchiveCourseError';
  }
}

export const COURSE_NOT_FOUND_MESSAGE = 'Course not found';
