import { NextResponse } from 'next/server';

import {
  Permission,
  RolePermissions,
  hasPermission,
} from '@/constants/permissions.enum';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { CourseProgressError } from '../errors/course-progress.errors';
import { getCourseProgress } from '../use-cases/get-course-progress.use-case';

export async function handleGetCourseProgressRequest(
  _req: Request,
  courseIdOrSlug: string,
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    if (
      !hasPermission(
        session.user.role as keyof typeof RolePermissions,
        Permission.PROGRESS_READ,
      )
    ) {
      return apiError('ليس لديك صلاحية', 403);
    }

    const data = await getCourseProgress({
      courseIdOrSlug,
      userId: session.user.id,
    });

    return apiSuccess(data, 'تم جلب تقدم الدورة بنجاح');
  } catch (error) {
    if (error instanceof CourseProgressError) {
      return apiError(error.message, error.status);
    }

    console.error('[COURSE_PROGRESS_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
