import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { CourseSectionsError } from '../errors/course-sections.errors';
import { getCourseSections } from '../use-cases/get-course-sections.use-case';

export async function handleGetCourseSectionsRequest(
  _request: Request,
  courseIdOrSlug: string,
): Promise<NextResponse> {
  try {
    const session = await auth();
    const data = await getCourseSections({
      courseIdOrSlug,
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
