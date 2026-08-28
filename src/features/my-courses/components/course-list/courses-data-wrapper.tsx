import { ErrorRetry } from '@/components/shared/ErrorRetry';
import { getStudentCourses } from '../../services/course.service';
import { MyCoursesDashboard } from '../dashboard/my-courses-dashboard';

export default async function CoursesDataWrapper({
  userId,
  page = 1,
  initialTab,
}: {
  userId: string;
  page: number;
  initialTab?: string;
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
    <MyCoursesDashboard
      courses={dataMyCourses.courses}
      totalEnrollments={dataMyCourses.total}
      currentPage={dataMyCourses.currentPage as number}
      totalPages={dataMyCourses.totalPages as number}
      initialTab={initialTab}
    />
  );
}
