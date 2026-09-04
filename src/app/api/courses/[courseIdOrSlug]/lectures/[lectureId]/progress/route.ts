import {
  handleGetLectureProgressRequest,
  handleUpdateLectureProgressRequest,
} from '@/features/courses/lecture-progress';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseIdOrSlug: string; lectureId: string }> },
) {
  const { courseIdOrSlug, lectureId } = await params;
  return handleGetLectureProgressRequest(req, courseIdOrSlug, lectureId);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseIdOrSlug: string; lectureId: string }> },
) {
  const { courseIdOrSlug, lectureId } = await params;
  return handleUpdateLectureProgressRequest(req, courseIdOrSlug, lectureId);
}
