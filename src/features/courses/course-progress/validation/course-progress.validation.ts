import { parseCourseSectionsParams } from '@/features/courses/course-sections/validation/course-sections.validation';

export function parseGetCourseProgressParams(params: unknown): {
  courseIdOrSlug: string;
} {
  return parseCourseSectionsParams(params);
}
