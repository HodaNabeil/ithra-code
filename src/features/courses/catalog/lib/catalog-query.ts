import type { GetCoursesParams } from '@/types/course/course.types';
import type { CourseCatalogQuery } from '../dto/course-catalog.dto';

export const COURSES_PAGE_LIMIT = 9;

export function getCoursesParamsToCatalogQuery(
  params: GetCoursesParams,
): CourseCatalogQuery {
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
