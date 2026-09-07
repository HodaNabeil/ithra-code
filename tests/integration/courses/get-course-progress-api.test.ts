import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { CourseProgressDTO } from '@/features/courses/course-progress/dto/course-progress.dto';
import { courseNotFoundMessage } from '@/features/courses/course-sections/errors/course-sections.errors';

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

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

import { GET } from '@/app/api/courses/[courseIdOrSlug]/progress/route';

type CourseProgressApiBody = {
  success: boolean;
  message: string;
  data?: CourseProgressDTO;
};

function setAuthenticatedUser(
  userId: string,
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'GUEST' = 'STUDENT',
) {
  mockAuth.mockResolvedValue({
    user: { id: userId, role },
  });
}

function setUnauthenticated() {
  mockAuth.mockResolvedValue(null);
}

async function callCourseProgressApi(courseIdOrSlug: string) {
  return GET(
    new Request(
      `http://localhost:3000/api/courses/${encodeURIComponent(courseIdOrSlug)}/progress`,
      { method: 'GET' },
    ),
    { params: Promise.resolve({ courseIdOrSlug }) },
  );
}

async function parseJson(response: Response): Promise<CourseProgressApiBody> {
  return response.json() as Promise<CourseProgressApiBody>;
}

/**
 * Publication eligibility rule:
 *   section.isPublished === true  AND  lecture.isPublished === true
 *
 * A published lecture inside an unpublished section is NOT eligible for
 * progress and is NOT counted in any metric.
 */
describe.skipIf(!isIntegrationEnabled)(
  'GET /api/courses/{courseIdOrSlug}/progress integration',
  () => {
    let fixture: CourseProgressTestFixture | undefined;
    let dbAvailable = false;

    beforeAll(async () => {
      dbAvailable = await canRunIntegrationTests();
    });

    beforeEach(async () => {
      mockAuth.mockReset();

      if (!dbAvailable) {
        return;
      }

      fixture = await createCourseProgressTestFixture();
    });

    afterEach(async () => {
      await cleanupCourseProgressTestFixture(fixture);
      fixture = undefined;
    });

    // ── Scenario 1: Authenticated enrolled user → 200 ────────────────────────

    it('returns 200 for an authenticated enrolled user', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.message).toBe('تم جلب تقدم الدورة بنجاح');
    });

    // ── Scenario 15: Slug resolution ─────────────────────────────────────────

    it('resolves the course using a slug', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.data?.totalLectures).toBe(expectedPublishedLectureCount()); // 1
    });

    // ── Scenario 16: CUID resolution ─────────────────────────────────────────

    it('resolves the course using a CUID', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseId);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.data?.totalLectures).toBe(expectedPublishedLectureCount()); // 1
    });

    // ── Scenario 11: No progress → zeros ─────────────────────────────────────

    it('returns zeros for an enrolled user with no progress rows', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentEmptyId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.data).toEqual({
        totalLectures: expectedPublishedLectureCount(), // 1
        completedLectures: 0,
        completionPercentage: 0,
        totalTimeSpent: 0,
        lastAccessedAt: null,
      });
    });

    // ── Scenario 12: Unenrolled user → 404 ───────────────────────────────────

    it('returns 404 for an unenrolled user without disclosing enrollment', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.instructorId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(courseNotFoundMessage(fixture.courseSlug));
      expect(body.data).toBeUndefined();
    });

    // ── Scenario 13: Missing authentication → 401 ────────────────────────────

    it('returns 401 when authentication is missing', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setUnauthenticated();

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Unauthorized');
    });

    // ── Scenario 14: No PROGRESS_READ → 403 ──────────────────────────────────

    it('returns 403 when the user lacks PROGRESS_READ permission', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId, 'GUEST');

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.message).toBe('ليس لديك صلاحية');
    });

    it('returns 404 for a nonexistent course', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const missingSlug = `missing-course-${fixture.suffix}`;
      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(missingSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(courseNotFoundMessage(missingSlug));
    });

    // ── Scenario 5: Progress from another user is excluded ────────────────────

    it('does not include progress from another user', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      // Student A: only A1 eligible (100s)
      expect(body.data?.totalTimeSpent).toBe(100);
      expect(body.data?.totalTimeSpent).not.toBe(50); // Student B's time
      // lastAccessedAt must be A1's timestamp, not B1's (excluded)
      expect(body.data?.lastAccessedAt).toBe(
        fixture.accessTimes.studentAPublished,
      );
      expect(body.data?.lastAccessedAt).not.toBe(fixture.accessTimes.studentB);
    });

    // ── Scenario 6: Progress from another course is excluded ──────────────────

    it('does not include progress from another course', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.data?.totalLectures).toBe(expectedPublishedLectureCount()); // 1
      expect(body.data?.totalTimeSpent).toBe(100);
      expect(body.data?.totalTimeSpent).not.toBe(5000); // foreign course
      expect(body.data?.lastAccessedAt).not.toBe(fixture.accessTimes.foreign);
    });

    // ── Scenario 2: Unpublished lecture in published section → excluded ────────
    // ── Scenario 3: Published lecture in unpublished section → excluded ─────────
    // ── Scenario 4: Unpublished lecture in unpublished section → excluded ───────

    it('excludes lectures that fail the section + lecture publication rule', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);

      // Only A1 is eligible → totalLectures = 1
      expect(body.data?.totalLectures).toBe(1);

      // A2 (unpublished in published section) and B1 (published in unpublished section)
      // and B2 (unpublished in unpublished section) must all be excluded.
      // If any were included, timeSpent would be > 100.
      const allLecturesTimeSpent = 100 + 999 + 200 + 888;
      expect(body.data?.totalTimeSpent).toBe(100);
      expect(body.data?.totalTimeSpent).not.toBe(allLecturesTimeSpent);

      // completedLectures must not count B2 or A2 completions
      expect(body.data?.completedLectures).not.toBe(3);
    });

    // ── Scenario 3 (explicit): Published lecture in unpublished section ────────

    it('excludes a published lecture inside an unpublished section (section + lecture publication rule)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);

      // B1 (published lecture in unpublished section) must not inflate the count.
      expect(body.data?.totalLectures).toBe(1); // only A1
      // B1's timeSpent (200s) must not appear.
      expect(body.data?.totalTimeSpent).toBe(100);
      // B1's lastAccessedAt timestamp must not appear.
      expect(body.data?.lastAccessedAt).not.toBe(
        fixture.accessTimes.studentAUnpublishedSection,
      );
    });

    // ── Scenario 7: isCompleted=true only → completedLectures ────────────────

    it('counts only isCompleted=true progress toward completedLectures', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      // A1 is completed. B1 is incomplete — but it's excluded anyway.
      expect(body.data?.completedLectures).toBe(1);
    });

    // ── Scenario 8: totalTimeSpent uses eligible lectures only ────────────────

    it('calculates totalTimeSpent from eligible lectures only', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      // Only A1's 100s must be counted.
      expect(body.data?.totalTimeSpent).toBe(100);
    });

    // ── Scenario 9: lastAccessedAt uses eligible lectures only ────────────────

    it('returns the latest lastAccessedAt from eligible lectures only', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      // B1 has a later timestamp (2026-01-15) but is excluded.
      // Only A1 (2026-01-10) is eligible.
      expect(body.data?.lastAccessedAt).toBe(
        fixture.accessTimes.studentAPublished,
      );
      expect(body.data?.lastAccessedAt).not.toBe(
        fixture.accessTimes.studentAUnpublishedSection,
      );
    });

    // ── Scenario 10: completionPercentage uses eligible lectures only ──────────

    it('calculates completionPercentage correctly and never exceeds 100', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callCourseProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      // 1 eligible lecture (A1), 1 completed → 100%
      expect(body.data?.completionPercentage).toBe(100);
      expect(body.data?.completionPercentage).toBeLessThanOrEqual(100);
      expect(body.data?.completedLectures).toBeLessThanOrEqual(
        body.data?.totalLectures ?? 0,
      );
    });
  },
);
