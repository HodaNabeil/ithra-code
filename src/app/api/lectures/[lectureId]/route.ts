import { NextResponse } from 'next/server';

import {
  Permission,
  RolePermissions,
  hasPermission,
} from '@/constants/permissions.enum';
import {
  LectureDetailError,
  getLecture,
} from '@/features/courses/lecture-detail';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lectureId: string }> },
): Promise<NextResponse> {
  const { lectureId } = await params;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    if (
      !hasPermission(
        session.user.role as keyof typeof RolePermissions,
        Permission.LECTURE_READ,
      )
    ) {
      return apiError('ليس لديك صلاحية', 403);
    }

    const data = await getLecture({
      lectureId,
      user: { id: session.user.id, role: session.user.role },
    });

    return apiSuccess(data, 'تم جلب المحاضرة بنجاح');
  } catch (error) {
    if (error instanceof LectureDetailError) {
      return apiError(error.message, error.status);
    }

    console.error('[LECTURE_DETAIL_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
