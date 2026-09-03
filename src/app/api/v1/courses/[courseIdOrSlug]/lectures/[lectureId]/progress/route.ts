import { handleUpdateLectureProgressRequest } from '@/features/courses/lecture-progress';

export async function PATCH(
  req: Request,
  {
    params,
  }: { params: Promise<{ courseIdOrSlug: string; lectureId: string }> },
) {
  const { courseIdOrSlug, lectureId } = await params;
  return handleUpdateLectureProgressRequest(req, courseIdOrSlug, lectureId);
}
