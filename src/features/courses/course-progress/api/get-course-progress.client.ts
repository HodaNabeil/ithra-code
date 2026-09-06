'use client';

import type { CourseProgressDTO } from '@/features/courses/course-progress/dto/course-progress.dto';
import type { ApiSuccessResponse } from '@/lib/api-response';
import { http } from '@/lib/http-client';

/**
 * Client entry point for GET /api/courses/:courseIdOrSlug/progress.
 */
export async function getCourseProgressClient(
  courseSlug: string,
): Promise<CourseProgressDTO> {
  const response = await http.get<ApiSuccessResponse<CourseProgressDTO>>(
    `/courses/${encodeURIComponent(courseSlug)}/progress`,
  );

  return response.data;
}
