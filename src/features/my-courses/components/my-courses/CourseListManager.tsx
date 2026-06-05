'use client';

import { useState, useMemo } from 'react';
import StudentFilter from './StudentFilter';
import CourseList from './CourseList';
import {
  StudentFilters,
  StudentCourseItem,
  Instructor,
} from '@/types/course/course.types';
import {
  filterStudentCourses,
  sortStudentCourses,
} from '../../services/client/course-logic';

interface CourseListManagerProps {
  initialCourses: StudentCourseItem[];
  tracks: { id: string; title: string }[];
  instructors: Instructor[];
}

export default function CourseListManager({
  initialCourses,
  tracks,
  instructors,
}: CourseListManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StudentFilters>({
    category: 'all',
    progress: 'all',
    instructor: 'all',
  });
  const [sortBy, setSortBy] = useState<string>('recent_access');

  const filteredAndSorted = useMemo(() => {
    const filtered = filterStudentCourses(initialCourses, searchQuery, filters);

    return sortStudentCourses(filtered, sortBy);
  }, [searchQuery, filters, initialCourses, sortBy]);

  const handleFilterChange = (key: keyof StudentFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ category: 'all', progress: 'all', instructor: 'all' });
    setSearchQuery('');
  };

  return (
    <>
      <StudentFilter
        categories={tracks.map((t) => ({ value: t.id, label: t.title }))}
        instructors={instructors}
        filters={filters}
        courses={initialCourses}
        onFilterChange={handleFilterChange}
        onLocalSearch={setSearchQuery}
        onReset={resetFilters}
      />

      <section className="section-gap pb-20">
        <CourseList
          courses={initialCourses}
          filteredCourses={filteredAndSorted}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </section>
    </>
  );
}
