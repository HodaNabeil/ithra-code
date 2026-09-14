import type { EnrollInFreeCourseOutputDTO } from '../dto/enroll-free-course.dto';

export interface FreeEnrollmentRepository {
  enrollInFreeCourse(
    studentId: string,
    courseIdOrSlug: string,
  ): Promise<EnrollInFreeCourseOutputDTO>;
}
