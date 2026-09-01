import { NextResponse } from 'next/server';

import {
  Permission,
  RolePermissions,
  hasPermission,
} from '@/constants/permissions.enum';
import { CourseAuthorizationError } from '@/features/courses/errors/course-authorization.errors';
import {
  LectureCreationError,
  createLectureUseCase,
  parseCreateLectureBody,
  parseCreateLectureParams,
} from '@/features/courses/lecture-creation';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sectionId: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    if (
      !hasPermission(
        session.user.role as keyof typeof RolePermissions,
        Permission.LECTURE_CREATE,
      )
    ) {
      return apiError('ليس لديك صلاحية', 403);
    }

    const { sectionId } = await params;
    const parsedParams = parseCreateLectureParams({ sectionId });

    const body = await req.json().catch(() => ({}));
    const parsedBody = parseCreateLectureBody(body);

    const result = await createLectureUseCase({
      sectionId: parsedParams.sectionId,
      body: parsedBody,
      user: { id: session.user.id, role: session.user.role },
    });

    return apiSuccess(result, 'Lecture created successfully', 201);
  } catch (error) {
    if (
      error instanceof LectureCreationError ||
      error instanceof CourseAuthorizationError
    ) {
      return apiError(error.message, error.status);
    }

    console.error('[LECTURE_CREATE_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
