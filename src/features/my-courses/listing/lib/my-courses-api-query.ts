import { PROGRESS_FILTERS } from '@/constants/my-courses';
import type { EnrollmentListProgressState } from '@/features/enrollments/application/constants';
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
  sortBy: 'enrolledAt' | 'title' | 'lastAccessedAt';
  sortOrder: 'asc' | 'desc';
  progressState?: EnrollmentListProgressState;
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
      return { sortBy: 'enrolledAt', sortOrder: 'desc' };
    case 'recent_access':
    default:
      return { sortBy: 'lastAccessedAt', sortOrder: 'desc' };
  }
}

function mapProgressFilterToProgressState(
  progressFilter?: string,
): EnrollmentListProgressState | undefined {
  switch (progressFilter) {
    case PROGRESS_FILTERS.COMPLETED:
      return 'completed';
    case PROGRESS_FILTERS.IN_PROGRESS:
      return 'in_progress';
    case PROGRESS_FILTERS.NOT_STARTED:
      return 'not_started';
    default:
      return undefined;
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
    progressState: mapProgressFilterToProgressState(params.progressFilter),
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

  if (query.progressState) {
    searchParams.set('progressState', query.progressState);
  }

  return searchParams.toString();
}

export function getOverviewEnrollmentsApiSearchParams(): string {
  return buildEnrollmentsApiSearchParams({
    page: 1,
    limit: ENROLLMENTS_MAX_LIMIT,
  });
}
