import { CoursesList } from '@/features/courses/components/courses-list';
import { getCourses } from '@/features/courses/services/course.service';
import {
  coursesPageQueryToGetCoursesParams,
  type CoursesPageQuery,
} from '@/features/courses/lib/courses-page-query';
import { ErrorRetry } from '@/components/shared/ErrorRetry';

type CoursesCatalogSectionProps = {
  query: CoursesPageQuery;
};

export async function CoursesCatalogSection({
  query,
}: CoursesCatalogSectionProps) {
  let coursesData;
  try {
    coursesData = await getCourses(coursesPageQueryToGetCoursesParams(query));
  } catch (error) {
    console.error('Error fetching courses catalog:', error);
    return <ErrorRetry />;
  }

  return (
    <CoursesList
      courses={coursesData.courses}
      pagination={{
        currentPage: coursesData.currentPage,
        totalPages: coursesData.totalPages,
      }}
    />
  );
}
