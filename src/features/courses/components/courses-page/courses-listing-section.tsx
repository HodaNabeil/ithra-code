import { CoursesList } from '@/features/courses/components/courses-list';
import { getCourses } from '@/features/courses/services/course.service';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import type { GetCoursesParams } from '@/types/course/course.types';

type CoursesListingSectionProps = {
  params: GetCoursesParams;
};

export async function CoursesListingSection({
  params,
}: CoursesListingSectionProps) {
  let coursesData;
  try {
    coursesData = await getCourses(params);
  } catch (error) {
    console.error('Error fetching courses list:', error);
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
