'use client';

import type { GetLectureResponse } from '@/features/courses/lecture-detail/dto/lecture-detail.dto';
import type { ApiSuccessResponse } from '@/lib/api-response';
import { http } from '@/lib/http-client';

/**
 * Client entry point for GET /api/lectures/:lectureId.
 */
export async function getLectureClient(
  lectureId: string,
): Promise<GetLectureResponse> {
  const response = await http.get<ApiSuccessResponse<GetLectureResponse>>(
    `/lectures/${encodeURIComponent(lectureId)}`,
  );

  return response.data;
}
