'use client';

import Link from 'next/link';
import { BookOpen, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CoursesPagination } from '@/components/shared/courses-pagination';
import { CourseCardStudent } from './CourseCard';
import { StudentCoursesResetFilters } from './student-courses-reset-filters';
import { EMPTY_STATES } from '@/constants/my-courses';
import { StudentCourseItem } from '@/types/course/course.types';

interface CourseListProps {
  courses: StudentCourseItem[];
  filteredCourses: StudentCourseItem[];
  currentPage?: number;
  totalPages?: number;
}

export default function CourseList({
  courses,
  filteredCourses,
  currentPage = 1,
  totalPages = 1,
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center space-y-6 py-20 text-center',
        )}
      >
        <div className={cn('rounded-full bg-muted p-6')}>
          <BookOpen className={cn('size-12 text-muted-foreground')} />
        </div>
        <div className="space-y-2">
          <h2 className={cn('text-2xl font-bold')}>
            {EMPTY_STATES.NO_ENROLLMENTS.title}
          </h2>
          <p className={cn('mx-auto max-w-xs text-muted-foreground')}>
            {EMPTY_STATES.NO_ENROLLMENTS.description}
          </p>
        </div>
        <Button asChild className={cn('h-12 rounded-full px-8 font-bold')}>
          <Link href={EMPTY_STATES.NO_ENROLLMENTS.buttonHref}>
            {EMPTY_STATES.NO_ENROLLMENTS.buttonText}
          </Link>
        </Button>
      </div>
    );
  }

  if (filteredCourses.length === 0) {
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
        <div className={cn('mb-4 flex justify-center')}>
          <SearchX className={cn('h-12 w-12 text-muted-foreground/50')} />
        </div>
        <h3 className={cn('mb-2 text-xl font-semibold')}>
          {EMPTY_STATES.NO_SEARCH_RESULTS.title}
        </h3>
        <p className={cn('mb-6 text-lg text-muted-foreground')}>
          {EMPTY_STATES.NO_SEARCH_RESULTS.description}
        </p>
        <StudentCoursesResetFilters />
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
        {filteredCourses.map((course) => (
          <CourseCardStudent key={course.id} course={course} />
        ))}
      </div>

      <CoursesPagination currentPage={currentPage} totalPages={totalPages} />
    </>
  );
}
