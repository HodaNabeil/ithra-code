import { ErrorRetry } from '@/components/shared/ErrorRetry';
import { getStudentCourses } from '../../services/course.service';
import CourseListManager from './CourseListManager';
import { CoursesPagination } from '@/components/shared/CoursesPagination';
import StudentHero from './StudentHero';

export default async function CoursesDataWrapper({
  userId,
  page = 1,
}: {
  userId: string;
  page: number;
}) {
  let dataMyCourses;
  try {
    dataMyCourses = await getStudentCourses(userId, page);
  } catch (_error) {
    return <ErrorRetry />;
  }

  if (dataMyCourses.courses.length === 0) {
    return (
      <div className="container section-gap text-center py-20">
        <p className="text-muted-foreground">لا توجد دورات ملتحق بها حالياً</p>
      </div>
    );
  }

  return (
    <>
      <StudentHero />
      <CourseListManager
        initialCourses={dataMyCourses.courses}
        tracks={dataMyCourses.tracks}
        instructors={dataMyCourses.instructors}
      />

      <CoursesPagination
        currentPage={dataMyCourses.currentPage as number}
        totalPages={dataMyCourses.totalPages as number}
      />
    </>
  );
}
