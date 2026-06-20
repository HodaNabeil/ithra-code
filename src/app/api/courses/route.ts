import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import {
  CourseCreationError,
  createCourseUseCase,
} from '@/features/courses/course-creation';
import { getCourseCatalog } from '@/features/courses/catalog/use-cases/get-course-catalog.use-case';
import { parseCourseCatalogSearchParams } from '@/features/courses/catalog/lib/catalog-api-query';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const data = await getCourseCatalog({
      query: parseCourseCatalogSearchParams({
        page: searchParams.get('page') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
        search: searchParams.get('search') ?? undefined,
        sort: searchParams.get('sort') ?? undefined,
        path: searchParams.get('path') ?? undefined,
        category: searchParams.get('category') ?? undefined,
        level: searchParams.get('level') ?? undefined,
        featured: searchParams.get('featured') ?? undefined,
      }),
      viewer: session?.user?.id
        ? { id: session.user.id, role: session.user.role }
        : null,
    });

    return apiSuccess(data, 'Courses fetched successfully');
  } catch (error) {
    console.error('[COURSE_CATALOG_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}

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
