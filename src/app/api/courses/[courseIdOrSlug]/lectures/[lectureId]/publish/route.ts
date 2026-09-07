import { NextResponse } from 'next/server';

import { CourseAuthorizationError } from '@/features/courses/errors/course-authorization.errors';
import { PublishCourseError } from '@/features/courses/errors/publish-course.errors';
import { publishLectureUseCase } from '@/features/courses/use-cases/publish-course.use-case';
import { defaultPublishCourseUseCaseDeps } from '@/features/courses/wiring/publish-course.wiring';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ courseIdOrSlug: string; lectureId: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    const { courseIdOrSlug, lectureId } = await params;

    const result = await publishLectureUseCase(
      {
        courseIdOrSlug,
        lectureId,
        user: { id: session.user.id, role: session.user.role },
      },
      defaultPublishCourseUseCaseDeps,
    );

    return apiSuccess(result, 'Lecture published successfully');
  } catch (error) {
    if (
      error instanceof PublishCourseError ||
      error instanceof CourseAuthorizationError
    ) {
      return apiError(error.message, error.status);
    }

    console.error('[LECTURE_PUBLISH_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
