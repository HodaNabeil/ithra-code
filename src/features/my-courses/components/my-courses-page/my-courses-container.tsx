import { CoursesSearch } from '@/features/courses/components/courses-search';
import { MyCoursesFilters } from '../my-courses-filters';
import { MyCoursesList } from '../my-courses-list';
import type { PaginationInfo } from '@/features/courses/components/courses-list';
import type { EnrollmentItem } from '@/types/course/course.types';

export function MyCoursesContainer({
  enrollments,
  pagination,
  totalEnrollments,
}: {
  enrollments: EnrollmentItem[];
  pagination: PaginationInfo;
  totalEnrollments: number;
}) {
  return (
    <section>
      <div className="space-y-8">
        {totalEnrollments > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <CoursesSearch />
            <MyCoursesFilters />
          </div>
        ) : null}

        <MyCoursesList
          enrollments={enrollments}
          pagination={pagination}
          totalEnrollments={totalEnrollments}
        />
      </div>
    </section>
  );
}
