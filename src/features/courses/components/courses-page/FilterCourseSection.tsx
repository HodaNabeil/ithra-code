import { getPathsForFilters } from '@/features/learning-paths/api';
import { CoursesFilters } from '../courses-filters';
import { CoursesSearch } from '../courses-search';

export async function FilterCourseSection() {
  const paths = await getPathsForFilters();

  return (
    <section>
      <div className="container">
        <div className="mx-auto mb-8 flex max-w-4xl flex-col gap-3 md:flex-row">
          <CoursesSearch />
          <CoursesFilters paths={paths} />
        </div>
      </div>
    </section>
  );
}
