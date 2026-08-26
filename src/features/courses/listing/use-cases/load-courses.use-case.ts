import { auth } from '@/lib/auth';
import type {
  GetCoursesParams,
  GetCoursesResult,
} from '@/types/course/course.types';
import type { CourseViewer } from '../dto/course-list.dto';
import { getCoursesParamsToListQuery } from '../lib/course-list-query';
import { mapCourseListResultToGetCoursesResult } from '../mapper/to-list-dto';
import { listCourses } from './list-courses.use-case';

async function resolveViewer(): Promise<CourseViewer> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return { id: session.user.id, role: session.user.role };
  } catch {
    return null;
  }
}

/** SSR / server-side course loader with RBAC + optional auth signals. */
export async function getCourses(
  params: GetCoursesParams,
): Promise<GetCoursesResult> {
  const viewer = await resolveViewer();
  const result = await listCourses({
    query: getCoursesParamsToListQuery(params),
    viewer,
  });

  return mapCourseListResultToGetCoursesResult(result);
}
