import { NextResponse } from 'next/server';

import {
  Permission,
  RolePermissions,
  hasPermission,
} from '@/constants/permissions.enum';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { LectureProgressError } from '../errors/lecture-progress.errors';
import { updateLectureProgress } from '../use-cases/update-lecture-progress.use-case';
import { updateLectureProgressBodySchema } from '../validation/lecture-progress.validation';

export async function handleUpdateLectureProgressRequest(
  req: Request,
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
        Permission.PROGRESS_UPDATE,
      )
    ) {
      return apiError('ليس لديك صلاحية', 403);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateLectureProgressBodySchema.safeParse(body);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? 'بيانات الطلب غير صالحة';
      return apiError(message, 400);
    }

    const progress = await updateLectureProgress({
      courseIdOrSlug,
      lectureId,
      userId: session.user.id,
      isCompleted: parsed.data.isCompleted,
      incrementTime: parsed.data.incrementTime,
    });

    return apiSuccess({ progress }, 'تم تحديث تقدم المحاضرة بنجاح');
  } catch (error) {
    if (error instanceof LectureProgressError) {
      return apiError(error.message, error.status);
    }

    console.error('[LECTURE_PROGRESS_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
