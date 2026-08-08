'use client';

import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/http-client';
import { COURSE_TAGS } from '@/lib/query-keys';
import type { ApiSuccessResponse } from '@/lib/api-response';
import type {
  CourseDetailApiDTO,
  GetCourseDetailResponse,
} from '@/features/courses/course-detail';

export function useCourseDetail(slug: string) {
  return useQuery({
    queryKey: COURSE_TAGS.course.detail(slug),
    queryFn: async (): Promise<CourseDetailApiDTO> => {
      const response = await http.get<
        ApiSuccessResponse<GetCourseDetailResponse>
      >(`/courses/${slug}`);

      return response.data.course;
    },
    enabled: !!slug,
    staleTime: 60_000,
  });
}
