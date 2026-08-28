import { CoursesSearch } from '@/features/courses/components/courses-search';
import StudentCoursesFilters from './courses-filters/student-courses-filters';
import {
  StudentFilters,
  Instructor,
} from '@/types/course/course.types';

interface StudentFilterProps {
  categories?: Array<{ value: string; label: string }>;
  instructors?: Instructor[];
  filters: StudentFilters;
  onFilterChange: (key: keyof StudentFilters, value: string) => void;
  onReset: () => void;
}

export default function StudentFilter({
  categories,
  instructors,
  filters,
  onFilterChange,
  onReset,
}: StudentFilterProps) {
  return (
    <section>
      <div className="container flex flex-wrap items-center gap-3">
        <CoursesSearch />
        <StudentCoursesFilters
          categories={categories}
          instructors={instructors}
          filters={filters}
          onFilterChange={onFilterChange}
          onReset={onReset}
        />
      </div>
    </section>
  );
}
