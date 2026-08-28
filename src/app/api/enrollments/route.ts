import { NextResponse } from 'next/server';

import {
  Permission,
  RolePermissions,
  hasPermission,
} from '@/constants/permissions.enum';
import {
  ENROLLMENTS_FETCHED_MESSAGE,
  EnrollmentError,
  listStudentEnrollments,
  parseEnrollmentListQuery,
} from '@/features/enrollments';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    if (
      !hasPermission(
        session.user.role as keyof typeof RolePermissions,
        Permission.ENROLLMENT_READ,
      )
    ) {
      return apiError('ليس لديك صلاحية', 403);
    }

    const { searchParams } = new URL(req.url);
    const query = parseEnrollmentListQuery({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    const data = await listStudentEnrollments({
      studentId: session.user.id,
      query,
    });

    return apiSuccess(data, ENROLLMENTS_FETCHED_MESSAGE);
  } catch (error) {
    if (error instanceof EnrollmentError) {
      return apiError(error.message, error.status);
    }

    console.error('[ENROLLMENTS_LIST_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
