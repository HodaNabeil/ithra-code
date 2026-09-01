/** Thrown by course-sections use-case; route handler maps `status` to HTTP responses. */
export class CourseSectionsError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'CourseSectionsError';
  }
}

export function courseNotFoundMessage(courseIdOrSlug: string): string {
  return `الدورة ذات المعرف '${courseIdOrSlug}' غير موجودة`;
}
