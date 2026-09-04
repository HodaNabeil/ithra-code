import { EnrollmentStatus } from '@prisma/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaCourseProgressRepository } from '@/features/courses/course-progress/repository/course-progress.repository';
import { PrismaLectureProgressRepository } from '@/features/courses/lecture-progress/repository/lecture-progress.repository';
import { prisma } from '@/lib/prisma';

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
 * Publication eligibility rule (section + lecture):
 *   A lecture is progress-eligible only when BOTH
 *     section.isPublished === true  AND  lecture.isPublished === true.
 *
 * This matches the student-facing course-sections navigation filter
 * (course-sections.select.ts buildCourseSectionsSelect publishedOnly=true).
 *
 * A published lecture inside an unpublished section is NOT eligible for
 * progress and does NOT count toward enrollment completion.
 */
describe.skipIf(!isIntegrationEnabled)(
  'PrismaCourseProgressRepository integration',
  () => {
    let fixture: CourseProgressTestFixture | undefined;
    let dbAvailable = false;
    const repository = new PrismaCourseProgressRepository();

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

    // ── Scenario 1: Published section + published lecture → eligible ──────────

    it('counts only section-and-lecture-published lectures for every metric', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const stats = await repository.findStatsByEnrollment(
        fixture.enrollmentAId,
        fixture.courseId,
      );

      // Only A1 (published section + published lecture) is eligible.
      expect(stats.totalLectures).toBe(expectedPublishedLectureCount()); // 1
      expect(stats.completedLectures).toBe(1); // A1 is completed
      expect(stats.totalTimeSpent).toBe(100); // only A1's 100s
      expect(stats.lastAccessedAt).toBe(fixture.accessTimes.studentAPublished);
      expect(stats.completionPercentage).toBe(100);
      expect(stats.completedLectures).toBeLessThanOrEqual(stats.totalLectures);
    });

    // ── Scenario 2: Published section + unpublished lecture → excluded ────────

    it('excludes unpublished lectures inside published sections from totals', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const stats = await repository.findStatsByEnrollment(
        fixture.enrollmentAId,
        fixture.courseId,
      );

      // A2 (unpublished lecture in published section) must not be counted.
      expect(stats.totalLectures).toBe(1);
      // timeSpent must not include A2's 999s
      expect(stats.totalTimeSpent).toBe(100);
      expect(stats.totalTimeSpent).not.toBe(100 + 999);
    });

    // ── Scenario 3: Unpublished section + published lecture → excluded ─────────

    it('excludes published lectures inside unpublished sections (section + lecture rule)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const stats = await repository.findStatsByEnrollment(
        fixture.enrollmentAId,
        fixture.courseId,
      );

      // B1 (published lecture in unpublished section) must not be counted.
      expect(stats.totalLectures).toBe(1); // only A1
      // timeSpent must not include B1's 200s
      expect(stats.totalTimeSpent).toBe(100);
      expect(stats.totalTimeSpent).not.toBe(100 + 200);
      // lastAccessedAt must not be B1's timestamp
      expect(stats.lastAccessedAt).not.toBe(
        fixture.accessTimes.studentAUnpublishedSection,
      );
    });

    // ── Scenario 4: Unpublished section + unpublished lecture → excluded ───────

    it('excludes unpublished lectures inside unpublished sections', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const stats = await repository.findStatsByEnrollment(
        fixture.enrollmentAId,
        fixture.courseId,
      );

      // B2 (unpublished lecture in unpublished section) — neither eligible.
      // Aggregate must not include its 888s.
      expect(stats.totalTimeSpent).not.toBe(100 + 999 + 200 + 888);
      expect(stats.completedLectures).not.toBe(3);
    });

    // ── Scenario 5: Progress from another user is excluded ────────────────────

    it('isolates progress to the requested enrollment (excludes other users)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const statsA = await repository.findStatsByEnrollment(
        fixture.enrollmentAId,
        fixture.courseId,
      );
      const statsB = await repository.findStatsByEnrollment(
        fixture.enrollmentBId,
        fixture.courseId,
      );

      // Student A: A1 only (100s, completed, accessed at studentAPublished)
      expect(statsA.completedLectures).toBe(1);
      expect(statsA.totalTimeSpent).toBe(100);
      expect(statsA.lastAccessedAt).toBe(fixture.accessTimes.studentAPublished);
      expect(statsA.completionPercentage).toBe(100);

      // Student B: A1 only (50s, completed, accessed at studentB)
      expect(statsB.completedLectures).toBe(1);
      expect(statsB.totalTimeSpent).toBe(50);
      expect(statsB.lastAccessedAt).toBe(fixture.accessTimes.studentB);
      expect(statsB.completionPercentage).toBe(100);
    });

    // ── Scenario 6: Progress from another course is excluded ──────────────────

    it('does not include lectures from another course', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const stats = await repository.findStatsByEnrollment(
        fixture.enrollmentAId,
        fixture.courseId,
      );

      expect(stats.totalLectures).toBe(expectedPublishedLectureCount()); // 1
      expect(stats.totalTimeSpent).toBe(100);
      expect(stats.totalTimeSpent).not.toBe(5000); // foreign course time
    });

    // ── Scenario 7: Only isCompleted=true contributes to completedLectures ────

    it('does not count incomplete progress toward completedLectures', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const stats = await repository.findStatsByEnrollment(
        fixture.enrollmentAId,
        fixture.courseId,
      );

      // A1 is completed; B1 (incomplete, but excluded anyway) must not count.
      expect(stats.completedLectures).toBe(1);
    });

    // ── Scenario 11: No progress → zeros ─────────────────────────────────────

    it('returns zeros and null lastAccessedAt for enrollment with no progress', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const stats = await repository.findStatsByEnrollment(
        fixture.enrollmentEmptyId,
        fixture.courseId,
      );

      expect(stats).toEqual({
        totalLectures: expectedPublishedLectureCount(), // 1
        completedLectures: 0,
        completionPercentage: 0,
        totalTimeSpent: 0,
        lastAccessedAt: null,
      });
    });

    it('does not include foreign-course progress when querying target enrollment', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const foreignStats = await repository.findStatsByEnrollment(
        fixture.foreignEnrollmentId,
        fixture.foreignCourseId,
      );

      // Foreign course: published section + published lecture → 1 eligible
      expect(foreignStats.totalLectures).toBe(1);
      expect(foreignStats.completedLectures).toBe(1);
      expect(foreignStats.totalTimeSpent).toBe(5000);
      expect(foreignStats.lastAccessedAt).toBe(fixture.accessTimes.foreign);
    });
  },
);

// ── Enrollment completion scenarios (scenarios 17 + 18) ──────────────────────

describe.skipIf(!isIntegrationEnabled)(
  'PrismaLectureProgressRepository enrollment completion integration',
  () => {
    let fixture: CourseProgressTestFixture | undefined;
    let dbAvailable = false;
    const lectureProgressRepo = new PrismaLectureProgressRepository();

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

    // ── Scenario 17: Enrollment completion when all visible lectures done ──────

    it('enrollment becomes COMPLETED when all eligible lectures are completed', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      // studentEmpty has no pre-seeded progress; complete the one eligible lecture (A1).
      await lectureProgressRepo.upsertProgressInTransaction({
        enrollmentId: fixture.enrollmentEmptyId,
        lectureId: fixture.publishedLectureId,
        courseId: fixture.courseId,
        isCompleted: true,
        incrementTime: 120,
        videoDuration: null,
      });

      const enrollment = await prisma.enrollment.findUnique({
        where: { id: fixture.enrollmentEmptyId },
        select: { status: true },
      });

      expect(enrollment?.status).toBe(EnrollmentStatus.COMPLETED);
    });

    // ── Scenario 18: Published lecture in unpublished section does not block ───

    it('a published lecture inside an unpublished section does not prevent enrollment completion', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      /**
       * Fixture:
       *   Published Section   → A1 (published)   → eligible
       *   Unpublished Section → B1 (published)   → NOT eligible under new rule
       *
       * Under the previous lecture-only rule:
       *   eligible set = { A1, B1 }
       *   Completing only A1 → 1/2 → enrollment stays ACTIVE (bug: stuck forever)
       *
       * Under the new section + lecture rule:
       *   eligible set = { A1 }
       *   Completing A1 → 1/1 → enrollment becomes COMPLETED (bug fixed)
       */

      // Complete only A1 — do NOT complete B1.
      await lectureProgressRepo.upsertProgressInTransaction({
        enrollmentId: fixture.enrollmentEmptyId,
        lectureId: fixture.publishedLectureId, // A1
        courseId: fixture.courseId,
        isCompleted: true,
        incrementTime: 120,
        videoDuration: null,
      });

      const enrollment = await prisma.enrollment.findUnique({
        where: { id: fixture.enrollmentEmptyId },
        select: { status: true },
      });

      // Verifies the completion-lock bug is fixed.
      expect(enrollment?.status).toBe(EnrollmentStatus.COMPLETED);

      // Verify B1 (published lecture in unpublished section) was not completed
      // and did not block the transition.
      const b1Progress = await prisma.progress.findFirst({
        where: {
          enrollmentId: fixture.enrollmentEmptyId,
          lectureId: fixture.publishedInUnpublishedSectionId,
        },
        select: { isCompleted: true },
      });
      expect(b1Progress).toBeNull(); // B1 was never touched
    });
  },
);
