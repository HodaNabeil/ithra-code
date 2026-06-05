import { FilterCourse } from '@/features/courses/components/FilterCourse';
import { getPublicPaths } from '@/features/learning-paths/services/path.queries';
import type { CategoryOption } from '@/types/course/course.types';

type FilterCourseSectionProps = {
  selectedCategory: CategoryOption | '';
};

export async function FilterCourseSection({
  selectedCategory,
}: FilterCourseSectionProps) {
  const { paths } = await getPublicPaths();

  return (
    <FilterCourse selectedCategory={selectedCategory || ''} paths={paths} />
  );
}
