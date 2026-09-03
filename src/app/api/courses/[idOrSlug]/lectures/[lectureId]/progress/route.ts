import { handleUpdateLectureProgressRequest } from '@/features/courses/lecture-progress';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ idOrSlug: string; lectureId: string }> },
) {
  const { idOrSlug, lectureId } = await params;
  return handleUpdateLectureProgressRequest(req, idOrSlug, lectureId);
}
