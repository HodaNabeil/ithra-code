import { NextResponse } from 'next/server';

import {
  Permission,
  RolePermissions,
  hasPermission,
} from '@/constants/permissions.enum';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { LectureProgressError } from '../errors/lecture-progress.errors';
import { listCourseLectureProgress } from '../use-cases/list-course-lecture-progress.use-case';

export async function handleListCourseLectureProgressRequest(
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

    const data = await listCourseLectureProgress({
      courseIdOrSlug,
      userId: session.user.id,
    });

    return apiSuccess(data, 'تم جلب تقدم محاضرات الدورة بنجاح');
  } catch (error) {
    if (error instanceof LectureProgressError) {
      return apiError(error.message, error.status);
    }

    console.error('[LIST_COURSE_LECTURE_PROGRESS_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
