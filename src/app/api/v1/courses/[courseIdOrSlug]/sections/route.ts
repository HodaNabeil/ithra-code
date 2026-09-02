import { handleGetCourseSectionsRequest } from '@/features/courses/course-sections';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseIdOrSlug: string }> },
) {
  const { courseIdOrSlug } = await params;
  return handleGetCourseSectionsRequest(request, courseIdOrSlug);
}
