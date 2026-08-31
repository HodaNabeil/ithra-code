import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { AUTH_ENDPOINTS } from '@/constants/auth';
import { APP_ROUTES } from '@/constants/enums';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import {
  MyCoursesContainer,
  MyCoursesDashboard,
} from '@/features/my-courses/components';
import { fetchEnrollments } from '@/features/my-courses/services/my-courses.service';
import type { EnrollmentItem } from '@/types/course/course.types';
import type { StudentSortOption } from '@/types/course/course.types';
import type { PaginationInfo } from '@/features/courses/components/courses-list';

interface MyCoursesPageProps {
  searchParams: Promise<{
    page?: string;
    tab?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function MyCoursesPage({
  searchParams,
}: MyCoursesPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const tab = resolvedSearchParams.tab || undefined;
  const search = resolvedSearchParams.search || undefined;
  const sort = (resolvedSearchParams.sort as StudentSortOption) || undefined;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`${AUTH_ENDPOINTS.LOGIN}?callbackUrl=${APP_ROUTES.MY_COURSES}`);
  }

  let allEnrollments: EnrollmentItem[] = [];
  let enrollments: EnrollmentItem[] = [];
  let pagination: PaginationInfo | undefined;
  let totalEnrollments = 0;
  let hasError = false;

  try {
    const result = await fetchEnrollments({
      page,
      search,
      sort,
    });
    enrollments = result.enrollments;
    allEnrollments = result.allEnrollments;
    totalEnrollments = result.total;
    pagination = {
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  } catch {
    hasError = true;
  }

  return (
    <>
      {!hasError && pagination && (
        <MyCoursesDashboard
          allEnrollments={allEnrollments}
          totalEnrollments={totalEnrollments}
          initialTab={tab}
          enrollmentsContent={
            <MyCoursesContainer
              enrollments={enrollments}
              pagination={pagination}
              totalEnrollments={totalEnrollments}
            />
          }
        />
      )}
      {hasError && <ErrorRetry />}
    </>
  );
}
