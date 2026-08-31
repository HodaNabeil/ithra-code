import { ENROLLMENTS_MAX_LIMIT } from '@/features/enrollments';
import type {
  GetMyCoursesParams,
  StudentSortOption,
} from '@/types/course/course.types';

export const MY_COURSES_PAGE_LIMIT = 9;

export type EnrollmentsApiQuery = {
  page: number;
  limit: number;
  search?: string;
  sortBy: 'enrolledAt' | 'title';
  sortOrder: 'asc' | 'desc';
};

function mapStudentSortToApi(sort?: StudentSortOption): {
  sortBy: EnrollmentsApiQuery['sortBy'];
  sortOrder: EnrollmentsApiQuery['sortOrder'];
} {
  switch (sort) {
    case 'title_asc':
      return { sortBy: 'title', sortOrder: 'asc' };
    case 'title_desc':
      return { sortBy: 'title', sortOrder: 'desc' };
    case 'recent_enroll':
    default:
      return { sortBy: 'enrolledAt', sortOrder: 'desc' };
  }
}

export function getEnrollmentsApiQuery(
  params: GetMyCoursesParams & { limit?: number },
): EnrollmentsApiQuery {
  const { sortBy, sortOrder } = mapStudentSortToApi(params.sort);

  return {
    page: Number(params.page) || 1,
    limit: params.limit ?? MY_COURSES_PAGE_LIMIT,
    search: params.search || undefined,
    sortBy,
    sortOrder,
  };
}

export function buildEnrollmentsApiSearchParams(
  params: GetMyCoursesParams & { limit?: number },
): string {
  const query = getEnrollmentsApiQuery(params);
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(query.page));
  searchParams.set('limit', String(query.limit));
  searchParams.set('sortBy', query.sortBy);
  searchParams.set('sortOrder', query.sortOrder);

  if (query.search) {
    searchParams.set('search', query.search);
  }

  return searchParams.toString();
}

export function getOverviewEnrollmentsApiSearchParams(): string {
  return buildEnrollmentsApiSearchParams({
    page: 1,
    limit: ENROLLMENTS_MAX_LIMIT,
  });
}
