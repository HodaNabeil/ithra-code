import { NextResponse } from 'next/server';

import { PublishCourseError } from '@/features/courses/errors/publish-course.errors';
import { publishCourseUseCase } from '@/features/courses/use-cases/publish-course.use-case';
import { defaultPublishCourseUseCaseDeps } from '@/features/courses/wiring/publish-course.wiring';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ idOrSlug: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    const { idOrSlug } = await params;

    const result = await publishCourseUseCase(
      {
        idOrSlug,
        user: { id: session.user.id, role: session.user.role },
      },
      defaultPublishCourseUseCaseDeps,
    );

    return apiSuccess(result, 'Course published successfully');
  } catch (error) {
    if (error instanceof PublishCourseError) {
      return apiError(error.message, error.status);
    }

    console.error('[COURSE_PUBLISH_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
