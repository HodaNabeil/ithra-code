'use client';

import { useMemo } from 'react';

import { PROGRESS_FILTERS } from '@/constants/my-courses';
import { useMyCoursesSearchParams } from '@/features/my-courses/hooks/use-my-courses-search-params';
import type { StudentCourseItem } from '@/types/course/course.types';
import {
  filterStudentCourses,
  sortStudentCourses,
} from '../../services/client/course-logic';
import { CourseListToolbar } from './course-list-toolbar';
import CourseList from './course-list';

interface CourseListManagerProps {
  initialCourses: StudentCourseItem[];
  currentPage: number;
  totalPages: number;
}

export default function CourseListManager({
  initialCourses,
  currentPage,
  totalPages,
}: CourseListManagerProps) {
  const searchParams = useMyCoursesSearchParams();

  const searchQuery = searchParams.get('search') || '';
  const progressFilter =
    searchParams.get('progress_filter') || PROGRESS_FILTERS.ALL;
  const sortBy = searchParams.get('sort') || 'recent_access';

  const filteredAndSorted = useMemo(() => {
    const filtered = filterStudentCourses(initialCourses, searchQuery, {
      category: 'all',
      progress: progressFilter,
      instructor: 'all',
    });

    return sortStudentCourses(filtered, sortBy);
  }, [initialCourses, progressFilter, searchQuery, sortBy]);

  return (
    <section className="space-y-8">
      {initialCourses.length > 0 ? <CourseListToolbar /> : null}
      <CourseList
        courses={initialCourses}
        filteredCourses={filteredAndSorted}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </section>
  );
}
