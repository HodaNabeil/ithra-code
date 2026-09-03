import { handleGetCourseSectionsRequest } from '@/features/courses/course-sections';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ idOrSlug: string }> },
) {
  const { idOrSlug } = await params;
  return handleGetCourseSectionsRequest(request, idOrSlug);
}
