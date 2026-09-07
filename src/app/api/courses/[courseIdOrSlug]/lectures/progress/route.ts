import { handleListCourseLectureProgressRequest } from '@/features/courses/lecture-progress';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseIdOrSlug: string }> },
) {
  const { courseIdOrSlug } = await params;
  return handleListCourseLectureProgressRequest(request, courseIdOrSlug);
}
