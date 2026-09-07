import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { getCourseProgress } from '@/features/courses/course-progress/use-cases/get-course-progress.use-case';
import { PrismaCourseSectionsRepository } from '@/features/courses/course-sections/repository/course-sections.repository';

import {
  canRunIntegrationTests,
  isIntegrationEnabled,
} from '../../helpers/integration';
import {
  cleanupCourseProgressTestFixture,
  createCourseProgressTestFixture,
  expectedPublishedLectureCount,
  type CourseProgressTestFixture,
} from '../../helpers/course-progress-fixture';

/**
 * Publication eligibility rule verified here:
 *   section.isPublished === true  AND  lecture.isPublished === true
 *
 * A published lecture inside an unpublished section is NOT eligible.
 */
describe.skipIf(!isIntegrationEnabled)(
  'getCourseProgress use case integration',
  () => {
    let fixture: CourseProgressTestFixture | undefined;
    let dbAvailable = false;
    const courseRepository = new PrismaCourseSectionsRepository();

    beforeAll(async () => {
      dbAvailable = await canRunIntegrationTests();
    });

    beforeEach(async () => {
      if (!dbAvailable) {
        return;
      }

      fixture = await createCourseProgressTestFixture();
    });

    afterEach(async () => {
      await cleanupCourseProgressTestFixture(fixture);
      fixture = undefined;
    });

    // ── Scenario 15: Slug resolution ──────────────────────────────────────────

    it('returns aggregation for enrolled student via slug', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const stats = await getCourseProgress(
        {
          courseIdOrSlug: fixture.courseSlug,
          userId: fixture.studentAId,
        },
        courseRepository,
      );

      // Only A1 is eligible (published section + published lecture).
      expect(stats.totalLectures).toBe(expectedPublishedLectureCount()); // 1
      expect(stats.completedLectures).toBe(1);
      expect(stats.totalTimeSpent).toBe(100);
      expect(stats.lastAccessedAt).toBe(fixture.accessTimes.studentAPublished);
      expect(stats.completionPercentage).toBe(100);
    });

    // ── Scenario 16: CUID resolution ─────────────────────────────────────────

    it('returns aggregation for enrolled student via course id', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const stats = await getCourseProgress(
        {
          courseIdOrSlug: fixture.courseId,
          userId: fixture.studentAId,
        },
        courseRepository,
      );

      expect(stats.totalLectures).toBe(expectedPublishedLectureCount()); // 1
      expect(stats.completedLectures).toBe(1);
      expect(stats.totalTimeSpent).toBe(100);
    });

    // ── Scenario 11: No progress → zeros ─────────────────────────────────────

    it('returns zeros for enrolled student with no progress rows', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const stats = await getCourseProgress(
        {
          courseIdOrSlug: fixture.courseSlug,
          userId: fixture.studentEmptyId,
        },
        courseRepository,
      );

      expect(stats).toEqual({
        totalLectures: expectedPublishedLectureCount(), // 1
        completedLectures: 0,
        completionPercentage: 0,
        totalTimeSpent: 0,
        lastAccessedAt: null,
      });
    });

    // ── Scenario 12: Unenrolled user → 404 ───────────────────────────────────

    it('masks missing enrollment as course not found for unenrolled user', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const { CourseProgressError } =
        await import('@/features/courses/course-progress/errors/course-progress.errors');

      await expect(
        getCourseProgress(
          {
            courseIdOrSlug: fixture.courseSlug,
            userId: fixture.instructorId,
          },
          courseRepository,
        ),
      ).rejects.toBeInstanceOf(CourseProgressError);

      await expect(
        getCourseProgress(
          {
            courseIdOrSlug: fixture.courseSlug,
            userId: fixture.instructorId,
          },
          courseRepository,
        ),
      ).rejects.toMatchObject({ status: 404 });
    });
  },
);
