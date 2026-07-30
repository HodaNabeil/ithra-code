/** Thrown by publish use-cases; route handlers map `status` to HTTP responses. */
export class PublishCourseError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'PublishCourseError';
  }
}

export const COURSE_NOT_FOUND_MESSAGE = 'Course not found';
export const LECTURE_NOT_FOUND_MESSAGE = 'Lecture not found';
