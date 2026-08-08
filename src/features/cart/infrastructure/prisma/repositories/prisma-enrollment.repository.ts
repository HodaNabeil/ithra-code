import { prisma } from '@/lib/prisma';
import type { EnrollmentRecord } from '../../../domain/policies/course-purchase.policy';
import type { EnrollmentRepository } from '../../../domain/repositories/enrollment.repository';

export class PrismaEnrollmentRepository implements EnrollmentRepository {
  async findByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentRecord | null> {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
      select: { status: true },
    });

    return enrollment;
  }
}

export const prismaEnrollmentRepository = new PrismaEnrollmentRepository();
