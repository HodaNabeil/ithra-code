import type { EnrollmentCourseDTO } from '../dto/enrollment-list.dto';

export interface EnrollmentCourseRepository {
  findByIds(courseIds: string[]): Promise<EnrollmentCourseDTO[]>;
}
