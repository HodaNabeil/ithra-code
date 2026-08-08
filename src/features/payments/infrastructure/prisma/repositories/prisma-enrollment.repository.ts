import { prisma } from '@/lib/prisma';
import type { EnrollmentRepository } from '@/features/payments/application/ports';
import type { PrismaClientLike } from '../prisma.types';

/**
 * Prisma-backed enrollment repository for payment fulfillment.
 * Grants ACTIVE course access; upserts so webhook retries stay idempotent.
 */
export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly db: PrismaClientLike = prisma) {}

  async createActiveEnrollments(
    studentId: string,
    courseIds: string[],
  ): Promise<void> {
    if (courseIds.length === 0) {
      return;
    }

    const enrolledAt = new Date();

    for (const courseId of courseIds) {
      await this.db.enrollment.upsert({
        where: {
          studentId_courseId: { studentId, courseId },
        },
        update: { status: 'ACTIVE' },
        create: {
          studentId,
          courseId,
          status: 'ACTIVE',
          enrolledAt,
        },
      });
    }
  }
}

export const prismaEnrollmentRepository = new PrismaEnrollmentRepository();
