import StudentCoursesFilters from './courses-filters/student-courses-filters';
import StudentCoursesSearch from './courses-filters/student-courses-search';
import {
  StudentFilters,
  Instructor,
  StudentCourseItem,
} from '@/types/course/course.types';

interface StudentFilterProps {
  categories?: Array<{ value: string; label: string }>;
  instructors?: Instructor[];
  filters: StudentFilters;
  courses?: StudentCourseItem[];
  onFilterChange: (key: keyof StudentFilters, value: string) => void;
  onLocalSearch: (query: string) => void;
  onReset: () => void;
}

export default function StudentFilter({
  categories,
  instructors,
  filters,
  courses = [],
  onFilterChange,
  onLocalSearch,
  onReset,
}: StudentFilterProps) {
  const suggestions = courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    firstLectureId: c.firstLectureId,
  }));

  return (
    <section>
      <div className="flex container  flex-row items-center justify-between gap-4">
        <StudentCoursesFilters
          categories={categories}
          instructors={instructors}
          filters={filters}
          onFilterChange={onFilterChange}
          onReset={onReset}
        />
        <StudentCoursesSearch
          onSearch={onLocalSearch}
          suggestions={suggestions}
          placeholder="البحث في دوراتي"
        />
      </div>
    </section>
  );
}
