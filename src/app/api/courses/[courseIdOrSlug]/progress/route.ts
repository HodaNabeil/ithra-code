import { handleGetCourseProgressRequest } from '@/features/courses/course-progress';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseIdOrSlug: string }> },
) {
  const { courseIdOrSlug } = await params;
  return handleGetCourseProgressRequest(request, courseIdOrSlug);
}
