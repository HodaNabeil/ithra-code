'use client';

import type { GetCourseSectionsResponse } from '@/features/courses/course-sections/dto/course-sections.dto';
import type { ApiSuccessResponse } from '@/lib/api-response';
import { http } from '@/lib/http-client';

/**
 * Client entry point for GET /api/courses/:courseIdOrSlug/sections.
 */
export async function getCourseSectionsClient(
  courseIdOrSlug: string,
): Promise<GetCourseSectionsResponse> {
  const response = await http.get<ApiSuccessResponse<GetCourseSectionsResponse>>(
    `/courses/${encodeURIComponent(courseIdOrSlug)}/sections`,
  );

  return response.data;
}
