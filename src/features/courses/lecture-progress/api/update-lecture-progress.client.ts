'use client';

import type {
  ProgressRecordDTO,
  UpdateLectureProgressBody,
  UpdateLectureProgressResponse,
} from '@/features/courses/lecture-progress/dto/lecture-progress.dto';
import type { ApiSuccessResponse } from '@/lib/api-response';
import { http } from '@/lib/http-client';

export type UpdateLectureProgressClientInput = {
  courseIdOrSlug: string;
  lectureId: string;
} & Partial<UpdateLectureProgressBody>;

/**
 * Client entry point for PATCH /api/v1/courses/:courseIdOrSlug/lectures/:lectureId/progress.
 * All UI progress writes must go through this function.
 */
export async function updateLectureProgressClient(
  input: UpdateLectureProgressClientInput,
): Promise<ProgressRecordDTO> {
  const { courseIdOrSlug, lectureId, isCompleted, incrementTime } = input;

  const body: Partial<UpdateLectureProgressBody> = {};
  if (isCompleted !== undefined) body.isCompleted = isCompleted;
  if (incrementTime !== undefined) body.incrementTime = incrementTime;

  const response = await http.patch<
    ApiSuccessResponse<UpdateLectureProgressResponse>
  >(
    `/v1/courses/${encodeURIComponent(courseIdOrSlug)}/lectures/${encodeURIComponent(lectureId)}/progress`,
    body,
  );

  return response.data.progress;
}
