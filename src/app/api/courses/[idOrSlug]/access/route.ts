import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import {
  CourseDetailError,
  courseDetailRepository,
} from '@/features/courses/course-detail';
import { mapCourseDetailEntityToPublicDTO } from '@/features/courses/course-detail/mapper/to-api-dto';
import { assertCourseVisible } from '@/features/courses/course-detail/policies/course-visibility.policy';
import { findUserCourseSignals } from '@/features/courses/services/user-course-signals.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> },
) {
  try {
    const { idOrSlug } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    const entity = await courseDetailRepository.findCourseBySlug(idOrSlug);
    if (!entity) {
      return apiError('Course not found', 404);
    }

    const user = { id: session.user.id, role: session.user.role };
    assertCourseVisible(mapCourseDetailEntityToPublicDTO(entity), user);

    const signals = await findUserCourseSignals(session.user.id, entity.id);

    return apiSuccess(
      { isEnrolled: signals.isPurchased },
      'Course access checked successfully',
    );
  } catch (error) {
    if (error instanceof CourseDetailError) {
      return apiError(error.message, error.status);
    }

    console.error('[ACCESS_CHECK_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
