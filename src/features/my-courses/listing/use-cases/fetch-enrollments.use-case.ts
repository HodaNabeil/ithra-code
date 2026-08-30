import type { EnrollmentListResult } from '@/features/enrollments';
import type { ApiSuccessResponse } from '@/lib/api-response';
import { httpServer } from '@/lib/http-server';
import type {
  GetMyCoursesParams,
  GetMyCoursesResult,
} from '@/types/course/course.types';
import { mapEnrollmentListItem } from '../mapper/enrollment-item.mapper';
import {
  buildEnrollmentsApiSearchParams,
  getOverviewEnrollmentsApiSearchParams,
} from '../lib/my-courses-api-query';

type EnrollmentsApiResponse = ApiSuccessResponse<EnrollmentListResult>;

async function requestEnrollmentsApi(
  searchParams: string,
): Promise<EnrollmentListResult> {
  const response = await httpServer.get<EnrollmentsApiResponse>(
    `/enrollments?${searchParams}`,
  );

  return response.data;
}

/** Loads student enrollments for the my-courses page via GET /api/enrollments. */
export async function fetchEnrollments(
  params: GetMyCoursesParams,
): Promise<GetMyCoursesResult> {
  const [overview, listing] = await Promise.all([
    requestEnrollmentsApi(getOverviewEnrollmentsApiSearchParams()),
    requestEnrollmentsApi(buildEnrollmentsApiSearchParams(params)),
  ]);

  const allEnrollments = overview.courses.map(mapEnrollmentListItem);
  const enrollments = listing.courses.map(mapEnrollmentListItem);
  const totalPages =
    listing.pagination.totalPages > 0 ? listing.pagination.totalPages : 1;

  return {
    enrollments,
    allEnrollments,
    total: overview.pagination.totalItems,
    totalPages,
    currentPage: listing.pagination.currentPage,
  };
}
