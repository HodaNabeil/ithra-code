import { prisma } from '@/lib/prisma';

import type {
  CourseContextRepositoryPort,
  EnrolledCourseWithProgressDTO,
} from '../../domain/ports/CourseContextRepositoryPort';

export class PrismaCourseContextRepository implements CourseContextRepositoryPort {
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
          where: { studentId: params.userId },
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
}

export const prismaCourseContextRepository = new PrismaCourseContextRepository();
