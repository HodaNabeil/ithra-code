import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import {
  CourseCreationError,
  createCourseUseCase,
} from '@/features/courses/course-creation';

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return apiError('Unauthorized', 401);
  }

  try {
    const body = await req.json();
    const course = await createCourseUseCase({
      input: body,
      userId: session.user.id,
      userRole: session.user.role,
    });

    return apiSuccess({ course }, 'Course draft created', 201);
  } catch (error) {
    if (error instanceof CourseCreationError) {
      return apiError(error.message, error.status);
    }

    console.error('[COURSE_CREATE_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
