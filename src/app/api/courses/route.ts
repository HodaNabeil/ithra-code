import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import {
  listCourses,
  parseCourseSearchParams,
} from '@/features/courses/listing';

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const data = await listCourses({
      query: parseCourseSearchParams({
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
    console.error('[COURSE_LIST_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
