import { CourseListDTO } from '@/types/course/course.dto';
import CourseHeader from './course-header';

export function CourseInfo({ course }: { course: CourseListDTO }) {
  return (
    <div>
      <CourseHeader
        title={course.title}
        rating={course.rating}
        ratingsCount={course.ratingCount}
        totalStudents={course.totalStudents || 0}
      />
    </div>
  );
}
