import type { EnrollmentStatus } from '@prisma/client';

import type { EnrollmentRecord } from '../../domain/enrollment.entity';

export type FindStudentEnrollmentsInput = {
  studentId: string;
  statuses: EnrollmentStatus[];
  take: number;
};

export interface EnrollmentReadRepository {
  findByStudentId(
    input: FindStudentEnrollmentsInput,
  ): Promise<EnrollmentRecord[]>;
}
