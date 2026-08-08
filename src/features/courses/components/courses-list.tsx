import type { CourseListDTO } from '@/types/course/course.dto';
import { CoursesPagination } from '@/components/shared/courses-pagination';
import { SearchX } from 'lucide-react';
import { CoursesResetFilters } from './courses-reset-filters';
import { CourseCard } from './course-card';
import { cn } from '@/lib/utils';

export type PaginationInfo = {
  currentPage: number;
  totalPages: number;
};

interface CoursesListProps {
  courses: CourseListDTO[];
  pagination?: PaginationInfo;
}

export function CoursesList({ courses, pagination }: CoursesListProps) {
  if (courses.length === 0) {
    return (
      <div
        className={cn(
          'text-center',
          'py-20',
          'bg-secondary/30',
          'rounded-2xl',
          'border',
          'border-dashed',
          'border-muted-foreground/20',
        )}
      >
        <div className={cn('flex', 'justify-center', 'mb-4')}>
          <SearchX className={cn('h-12', 'w-12', 'text-muted-foreground/50')} />
        </div>
        <h3 className={cn('text-xl', 'font-semibold', 'mb-2')}>
          لا توجد نتائج
        </h3>
        <p className={cn('text-muted-foreground', 'text-lg', 'mb-6')}>
          لم نتمكن من العثور على أي دورات تطابق معايير البحث الخاصة بك.
        </p>
        <CoursesResetFilters />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'grid',
          'grid-cols-1',
          'md:grid-cols-2',
          'lg:grid-cols-3',
          'gap-6',
        )}
      >
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      <CoursesPagination
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
      />
    </>
  );
}
