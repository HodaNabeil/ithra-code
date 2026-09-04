import { handleGetCourseProgressRequest } from '@/features/courses/course-progress';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ idOrSlug: string }> },
) {
  const { idOrSlug } = await params;
  return handleGetCourseProgressRequest(request, idOrSlug);
}
