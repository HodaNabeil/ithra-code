import type { GetCoursesParams } from '@/types/course/course.types';
import type { CourseListQuery } from '../dto/course-list.dto';

export const COURSES_PAGE_LIMIT = 9;

export function getCoursesParamsToListQuery(
  params: GetCoursesParams,
): CourseListQuery {
  return {
    page: Number(params.page) || 1,
    limit: COURSES_PAGE_LIMIT,
    search: params.search || undefined,
    sort: params.sort || 'newest',
    path: params.path ?? params.category,
    level: params.level,
    featured: params.featured,
  };
}
