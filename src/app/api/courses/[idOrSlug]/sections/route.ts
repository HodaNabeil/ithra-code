import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import {
  CourseSectionsError,
  getCourseSections,
} from '@/features/courses/course-sections';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ idOrSlug: string }> },
): Promise<NextResponse> {
  const { idOrSlug } = await params;

  try {
    const session = await auth();
    const data = await getCourseSections({
      idOrSlug,
      user: session?.user?.id
        ? { id: session.user.id, role: session.user.role }
        : null,
    });

    return apiSuccess(data, 'تم جلب الأقسام بنجاح');
  } catch (error) {
    if (error instanceof CourseSectionsError) {
      return apiError(error.message, error.status);
    }

    console.error('[COURSE_SECTIONS_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
