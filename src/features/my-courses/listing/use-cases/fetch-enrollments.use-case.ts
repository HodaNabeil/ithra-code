import {
  ENROLLMENTS_MAX_LIMIT,
  listStudentEnrollments,
} from '@/features/enrollments';
import type {
  GetMyCoursesParams,
  GetMyCoursesResult,
} from '@/types/course/course.types';
import { mapEnrollmentListItem } from '../mapper/enrollment-item.mapper';
import { getEnrollmentsApiQuery } from '../lib/my-courses-api-query';

type FetchEnrollmentsParams = GetMyCoursesParams & {
  studentId: string;
};

/** Loads student enrollments for the my-courses page. */
export async function fetchEnrollments(
  params: FetchEnrollmentsParams,
): Promise<GetMyCoursesResult> {
  const { studentId, ...queryParams } = params;

  const [overview, listing] = await Promise.all([
    listStudentEnrollments({
      studentId,
      query: getEnrollmentsApiQuery({
        page: 1,
        limit: ENROLLMENTS_MAX_LIMIT,
      }),
    }),
    listStudentEnrollments({
      studentId,
      query: getEnrollmentsApiQuery(queryParams),
    }),
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
