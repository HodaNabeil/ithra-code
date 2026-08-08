import { CoursesFilters } from '../courses-filters';
import { CoursesSearch } from '../courses-search';
import { CoursesList } from '../courses-list';
import type { CourseListDTO } from '@/types/course/course.dto';
import type { PaginationInfo } from '../courses-list';
import { PathListDTO } from '@/types/path/path.dto';

export function CoursesContainer({
  courses,
  pagination,
  paths,
}: {
  courses: CourseListDTO[];
  pagination: PaginationInfo;
  paths: PathListDTO[];
}) {
  return (
    <section>
      <div className="container space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <CoursesSearch />
          <CoursesFilters paths={paths} />
        </div>

        <CoursesList courses={courses} pagination={pagination} />
      </div>
    </section>
  );
}
