import type { EnrollmentStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import type { EnrollmentReadRepository } from '../../application/ports/enrollment.repository';
import type { EnrollmentRecord } from '../../domain/enrollment.entity';

export class PrismaEnrollmentReadRepository implements EnrollmentReadRepository {
  async findByStudentId(input: {
    studentId: string;
    statuses: EnrollmentStatus[];
    take: number;
  }): Promise<EnrollmentRecord[]> {
    if (input.statuses.length === 0) {
      return [];
    }

    return prisma.enrollment.findMany({
      where: {
        studentId: input.studentId,
        status: { in: input.statuses },
      },
      orderBy: { enrolledAt: 'desc' },
      take: input.take,
      select: {
        id: true,
        studentId: true,
        courseId: true,
        status: true,
        enrolledAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export const prismaEnrollmentReadRepository =
  new PrismaEnrollmentReadRepository();
