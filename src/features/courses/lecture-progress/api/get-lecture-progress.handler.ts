import { NextResponse } from 'next/server';

import {
  Permission,
  RolePermissions,
  hasPermission,
} from '@/constants/permissions.enum';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { LectureProgressError } from '../errors/lecture-progress.errors';
import { getLectureProgress } from '../use-cases/get-lecture-progress.use-case';

export async function handleGetLectureProgressRequest(
  _req: Request,
  courseIdOrSlug: string,
  lectureId: string,
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

    const progress = await getLectureProgress({
      courseIdOrSlug,
      lectureId,
      userId: session.user.id,
    });

    return apiSuccess({ progress }, 'تم جلب تقدم المحاضرة بنجاح');
  } catch (error) {
    if (error instanceof LectureProgressError) {
      return apiError(error.message, error.status);
    }

    console.error('[LECTURE_PROGRESS_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
