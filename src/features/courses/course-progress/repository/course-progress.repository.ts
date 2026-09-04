import { prisma } from '@/lib/prisma';

import { computeCompletionPercentage } from '@/features/enrollments/application/lib/progress-stats';

import type { CourseProgressDTO } from '../dto/course-progress.dto';

export type CourseProgressStats = CourseProgressDTO;

export interface CourseProgressRepository {
  findStatsByEnrollment(
    enrollmentId: string,
    courseId: string,
  ): Promise<CourseProgressStats>;
}

export class PrismaCourseProgressRepository implements CourseProgressRepository {
  async findStatsByEnrollment(
    enrollmentId: string,
    courseId: string,
  ): Promise<CourseProgressStats> {
    const publishedLectures = await prisma.lecture.findMany({
      where: {
        isPublished: true,
        section: { courseId, isPublished: true },
      },
      select: { id: true },
    });

    const publishedLectureIds = publishedLectures.map((lecture) => lecture.id);
    const totalLectures = publishedLectureIds.length;

    if (publishedLectureIds.length === 0) {
      return {
        totalLectures: 0,
        completedLectures: 0,
        completionPercentage: 0,
        totalTimeSpent: 0,
        lastAccessedAt: null,
      };
    }

    const progressWhere = {
      enrollmentId,
      lectureId: { in: publishedLectureIds },
    };

    const [completedLectures, aggregates] = await Promise.all([
      prisma.progress.count({
        where: {
          ...progressWhere,
          isCompleted: true,
        },
      }),
      prisma.progress.aggregate({
        where: progressWhere,
        _sum: { timeSpent: true },
        _max: { lastAccessedAt: true },
      }),
    ]);

    return {
      totalLectures,
      completedLectures,
      totalTimeSpent: aggregates._sum.timeSpent ?? 0,
      completionPercentage: computeCompletionPercentage(
        completedLectures,
        totalLectures,
      ),
      lastAccessedAt:
        aggregates._max.lastAccessedAt?.toISOString() ?? null,
    };
  }
}

export const courseProgressRepository = new PrismaCourseProgressRepository();
