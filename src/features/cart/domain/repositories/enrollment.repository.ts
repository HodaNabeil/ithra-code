import type { EnrollmentRecord } from '../policies/course-purchase.policy';

export interface EnrollmentRepository {
  findByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentRecord | null>;
}
