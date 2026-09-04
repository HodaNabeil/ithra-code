import { handleListCourseLectureProgressRequest } from '@/features/courses/lecture-progress';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ idOrSlug: string }> },
) {
  const { idOrSlug: courseIdOrSlug } = await params;
  return handleListCourseLectureProgressRequest(request, courseIdOrSlug);
}
