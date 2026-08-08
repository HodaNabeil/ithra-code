import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import {
  CourseOverviewError,
  getCourseOverview,
} from '@/features/courses/course-overview';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ idOrSlug: string }> },
): Promise<NextResponse> {
  const { idOrSlug } = await params;

  try {
    const session = await auth();
    const data = await getCourseOverview({
      idOrSlug,
      user: session?.user?.id
        ? { id: session.user.id, role: session.user.role }
        : null,
    });

    return apiSuccess(data, 'تم جلب نظرة عامة على الدورة بنجاح');
  } catch (error) {
    if (error instanceof CourseOverviewError) {
      return apiError(error.message, error.status);
    }

    console.error('[COURSE_OVERVIEW_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
