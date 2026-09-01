import { prisma } from '@/lib/prisma';

import type { EnrollmentProgressDTO } from '../../application/dto/enrollment-list.dto';
import type {
  EnrollmentProgressLookup,
  EnrollmentProgressRepository,
} from '../../application/ports/progress.repository';
import { computeCompletionPercentage } from '../../application/lib/progress-stats';

export class PrismaEnrollmentProgressRepository implements EnrollmentProgressRepository {
  async findStatsByEnrollmentIds(
    enrollments: EnrollmentProgressLookup[],
  ): Promise<Map<string, EnrollmentProgressDTO>> {
    const stats = new Map<string, EnrollmentProgressDTO>();

    if (enrollments.length === 0) {
      return stats;
    }

    const enrollmentIds = enrollments.map((row) => row.enrollmentId);
    const courseIds = [...new Set(enrollments.map((row) => row.courseId))];

    const [progressRows, publishedLectures] = await Promise.all([
      prisma.progress.findMany({
        where: { enrollmentId: { in: enrollmentIds } },
        select: {
          enrollmentId: true,
          isCompleted: true,
          timeSpent: true,
          lastAccessedAt: true,
        },
      }),
      prisma.lecture.findMany({
        where: {
          isPublished: true,
          section: { courseId: { in: courseIds } },
        },
        select: {
          section: { select: { courseId: true } },
        },
      }),
    ]);

    const totalLecturesByCourseId = new Map<string, number>();
    for (const lecture of publishedLectures) {
      const courseId = lecture.section.courseId;
      totalLecturesByCourseId.set(
        courseId,
        (totalLecturesByCourseId.get(courseId) ?? 0) + 1,
      );
    }

    const progressByEnrollmentId = new Map<
      string,
      {
        completedLectures: number;
        totalTimeSpent: number;
        lastAccessedAt: Date | null;
      }
    >();

    for (const row of progressRows) {
      const current = progressByEnrollmentId.get(row.enrollmentId) ?? {
        completedLectures: 0,
        totalTimeSpent: 0,
        lastAccessedAt: null,
      };

      if (row.isCompleted) {
        current.completedLectures += 1;
      }
      current.totalTimeSpent += row.timeSpent;

      if (
        !current.lastAccessedAt ||
        row.lastAccessedAt > current.lastAccessedAt
      ) {
        current.lastAccessedAt = row.lastAccessedAt;
      }

      progressByEnrollmentId.set(row.enrollmentId, current);
    }

    for (const enrollment of enrollments) {
      const totals = progressByEnrollmentId.get(enrollment.enrollmentId);
      const totalLectures =
        totalLecturesByCourseId.get(enrollment.courseId) ?? 0;
      const completedLectures = totals?.completedLectures ?? 0;
      const totalTimeSpent = totals?.totalTimeSpent ?? 0;

      stats.set(enrollment.enrollmentId, {
        totalLectures,
        completedLectures,
        totalTimeSpent,
        completionPercentage: computeCompletionPercentage(
          completedLectures,
          totalLectures,
        ),
        lastAccessedAt: totals?.lastAccessedAt?.toISOString() ?? null,
      });
    }

    return stats;
  }
}

export const prismaEnrollmentProgressRepository =
  new PrismaEnrollmentProgressRepository();
