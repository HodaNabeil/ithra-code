import { Suspense } from 'react';

import { auth } from '@/lib/auth';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import {
  MyCoursesContainer,
  MyCoursesDashboard,
  MyCoursesSignInRequired,
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
    return <MyCoursesSignInRequired />;
  }

  let allEnrollments: EnrollmentItem[] = [];
  let enrollments: EnrollmentItem[] = [];
  let pagination: PaginationInfo | undefined;
  let totalEnrollments = 0;
  let hasError = false;

  try {
    const result = await fetchEnrollments({
      studentId: session.user.id,
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

  if (hasError) {
    return <ErrorRetry message="حدث خطأ أثناء تحميل الدورات" />;
  }

  const resolvedPagination: PaginationInfo = pagination ?? {
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <Suspense fallback={<div className="container py-6 lg:py-8" />}>
      <MyCoursesDashboard
        allEnrollments={allEnrollments}
        totalEnrollments={totalEnrollments}
        initialTab={tab}
        enrollmentsContent={
          <MyCoursesContainer
            enrollments={enrollments}
            pagination={resolvedPagination}
            totalEnrollments={totalEnrollments}
          />
        }
      />
    </Suspense>
  );
}
