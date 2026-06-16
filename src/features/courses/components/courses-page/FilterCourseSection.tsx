import { getPublicPaths } from '@/features/learning-paths/services/path.queries';
import { CoursesFilters } from '../courses-filters';
import { CoursesSearch } from '../courses-search';

export async function FilterCourseSection() {
  const { paths } = await getPublicPaths();

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
