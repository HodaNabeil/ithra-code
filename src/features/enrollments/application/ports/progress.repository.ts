import type { EnrollmentProgressDTO } from '../dto/enrollment-list.dto';

export type EnrollmentProgressLookup = {
  enrollmentId: string;
  courseId: string;
};

export interface EnrollmentProgressRepository {
  findStatsByEnrollmentIds(
    enrollments: EnrollmentProgressLookup[],
  ): Promise<Map<string, EnrollmentProgressDTO>>;
}
