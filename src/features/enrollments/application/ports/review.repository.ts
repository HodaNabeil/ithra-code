import type { EnrollmentReviewDTO } from '../dto/enrollment-list.dto';

export interface EnrollmentReviewRepository {
  findByUserAndCourseIds(
    userId: string,
    courseIds: string[],
  ): Promise<EnrollmentReviewDTO[]>;
}
