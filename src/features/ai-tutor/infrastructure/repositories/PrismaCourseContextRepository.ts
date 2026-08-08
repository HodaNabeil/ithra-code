import { EnrollmentStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import {
  AskTutorError,
  AskTutorErrorCodes,
} from '../../application/errors/ask-tutor.errors';
import { platformMetrics } from '@/ai-platform/observability/metrics/platform-metrics';
import type {
  CourseContextRepositoryPort,
  EnrolledCourseWithProgressDTO,
} from '../../domain/ports/CourseContextRepositoryPort';

const ACTIVE_ENROLLMENT_STATUSES = [
  EnrollmentStatus.ACTIVE,
  EnrollmentStatus.COMPLETED,
] as const;

export class PrismaCourseContextRepository implements CourseContextRepositoryPort {
  async assertStudentEnrolled(params: {
    userId: string;
    courseSlug: string;
  }): Promise<void> {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: params.userId,
        status: { in: [...ACTIVE_ENROLLMENT_STATUSES] },
        course: { slug: params.courseSlug },
      },
      select: { id: true },
    });

    if (!enrollment) {
      platformMetrics.incrementAuthFailure('enrollment_not_found');
      throw new AskTutorError(
        403,
        'لا يمكنك الوصول إلى مدرس هذه الدورة',
        AskTutorErrorCodes.UNAUTHORIZED,
      );
    }
  }

  async findEnrolledCourseWithProgress(params: {
    courseSlug: string;
    userId: string;
  }): Promise<EnrolledCourseWithProgressDTO | null> {
    return prisma.course.findFirst({
      where: {
        slug: params.courseSlug,
        enrollments: {
          some: {
            studentId: params.userId,
            status: {
              in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
            },
          },
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        shortDescription: true,
        level: true,
        objectives: true,
        requirements: true,
        knowledgeIndexedAt: true,
        sections: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            position: true,
            lectures: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                position: true,
              },
            },
          },
        },
        enrollments: {
          where: {
            studentId: params.userId,
            status: {
              in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
            },
          },
          select: {
            status: true,
            student: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
              },
            },
            progress: {
              select: {
                lectureId: true,
                isCompleted: true,
                timeSpent: true,
                lastAccessedAt: true,
              },
            },
          },
          take: 1,
        },
      },
    });
  }

  async getAccessibleCourseIds(
    userId: string,
    courseIds: string[],
  ): Promise<Set<string>> {
    if (courseIds.length === 0) {
      return new Set();
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: userId,
        courseId: { in: courseIds },
        status: {
          in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
        },
      },
      select: { courseId: true },
    });

    return new Set(enrollments.map((enrollment) => enrollment.courseId));
  }
}

export const prismaCourseContextRepository = new PrismaCourseContextRepository();
