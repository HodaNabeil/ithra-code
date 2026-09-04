import { EnrollmentStatus, Role } from '@prisma/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GetLectureProgressResponse } from '@/features/courses/lecture-progress/dto/lecture-progress.dto';
import { lectureNotFoundMessage } from '@/features/courses/lecture-detail';
import { enrollmentAccessDeniedMessage } from '@/features/courses/lecture-progress/errors/lecture-progress.errors';
import { prisma } from '@/lib/prisma';

import {
  canRunIntegrationTests,
  isIntegrationEnabled,
} from '../../helpers/integration';
import {
  cleanupCourseProgressTestFixture,
  createCourseProgressTestFixture,
  type CourseProgressTestFixture,
} from '../../helpers/course-progress-fixture';

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

import { GET, PATCH } from '@/app/api/courses/[courseIdOrSlug]/lectures/[lectureId]/progress/route';

type LectureProgressApiBody = {
  success: boolean;
  message: string;
  data?: GetLectureProgressResponse;
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

async function callGetLectureProgressApi(
  courseIdOrSlug: string,
  lectureId: string,
) {
  return GET(
    new Request(
      `http://localhost:3000/api/courses/${encodeURIComponent(courseIdOrSlug)}/lectures/${lectureId}/progress`,
      { method: 'GET' },
    ),
    { params: Promise.resolve({ courseIdOrSlug, lectureId }) },
  );
}

async function callPatchLectureProgressApi(
  courseIdOrSlug: string,
  lectureId: string,
  body: { isCompleted: boolean; incrementTime: number },
) {
  return PATCH(
    new Request(
      `http://localhost:3000/api/courses/${encodeURIComponent(courseIdOrSlug)}/lectures/${lectureId}/progress`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    ),
    { params: Promise.resolve({ courseIdOrSlug, lectureId }) },
  );
}

async function parseJson(response: Response): Promise<LectureProgressApiBody> {
  return response.json() as Promise<LectureProgressApiBody>;
}

async function findProgress(
  enrollmentId: string,
  lectureId: string,
) {
  return prisma.progress.findUnique({
    where: {
      enrollmentId_lectureId: { enrollmentId, lectureId },
    },
  });
}

/**
 * Student lecture access rule:
 *   section.isPublished === true  AND  lecture.isPublished === true
 */
describe.skipIf(!isIntegrationEnabled)(
  'GET /api/courses/{courseIdOrSlug}/lectures/{lectureId}/progress integration',
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

    it('returns 200 with progress for a published lecture in a published section (A1)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data?.progress).not.toBeNull();
      expect(body.data?.progress?.lectureId).toBe(fixture.publishedLectureId);
      expect(body.data?.progress?.timeSpent).toBe(100);
    });

    it('returns 404 for a published lecture in an unpublished section (B1) even when progress exists', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const existing = await findProgress(
        fixture.enrollmentAId,
        fixture.publishedInUnpublishedSectionId,
      );
      expect(existing).not.toBeNull();

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedInUnpublishedSectionId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.publishedInUnpublishedSectionId),
      );
      expect(body.data).toBeUndefined();
    });

    it('returns 404 for an unpublished lecture in a published section (A2)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.unpublishedLectureId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.unpublishedLectureId),
      );
    });

    it('returns 404 for an unpublished lecture in an unpublished section (B2)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.unpublishedInUnpublishedSectionId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.unpublishedInUnpublishedSectionId),
      );
    });

    it('returns 401 when authentication is missing', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setUnauthenticated();

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Unauthorized');
    });

    it('returns 403 when the user lacks PROGRESS_READ permission', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId, 'GUEST');

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.message).toBe('ليس لديك صلاحية');
    });

    it('returns 404 for an unenrolled user without disclosing enrollment', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.instructorId);

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.publishedLectureId),
      );
    });

    it('returns 404 for an ineligible enrollment status', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const droppedStudent = await prisma.user.create({
        data: {
          email: `dropped-student-${fixture.suffix}@test.local`,
          role: Role.STUDENT,
          name: 'Dropped Student',
        },
      });

      await prisma.enrollment.create({
        data: {
          studentId: droppedStudent.id,
          courseId: fixture.courseId,
          status: EnrollmentStatus.DROPPED,
        },
      });

      setAuthenticatedUser(droppedStudent.id);

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.publishedLectureId),
      );

      await prisma.enrollment.deleteMany({
        where: { studentId: droppedStudent.id },
      });
      await prisma.user.delete({ where: { id: droppedStudent.id } });
    });

    it('resolves the course using a slug', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
      );

      expect(response.status).toBe(200);
    });

    it('resolves the course using a CUID', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureProgressApi(
        fixture.courseId,
        fixture.publishedLectureId,
      );

      expect(response.status).toBe(200);
    });

    it('returns 404 when the lecture belongs to a different course', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.foreignLectureId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.foreignLectureId),
      );
    });

    it('does not return another user progress (cross-user isolation)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentBId);

      const response = await callGetLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.data?.progress?.timeSpent).toBe(50);
      expect(body.data?.progress?.timeSpent).not.toBe(100);
    });
  },
);

describe.skipIf(!isIntegrationEnabled)(
  'PATCH /api/courses/{courseIdOrSlug}/lectures/{lectureId}/progress integration',
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

    it('updates progress for a published lecture in a published section (A1)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentEmptyId);

      const before = await findProgress(
        fixture.enrollmentEmptyId,
        fixture.publishedLectureId,
      );
      expect(before).toBeNull();

      const response = await callPatchLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
        { isCompleted: false, incrementTime: 30 },
      );
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data?.progress?.timeSpent).toBe(30);

      const after = await findProgress(
        fixture.enrollmentEmptyId,
        fixture.publishedLectureId,
      );
      expect(after?.timeSpent).toBe(30);
    });

    it('returns 404 for a published lecture in an unpublished section (B1) without mutating progress', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const before = await findProgress(
        fixture.enrollmentAId,
        fixture.publishedInUnpublishedSectionId,
      );
      expect(before?.timeSpent).toBe(200);

      const response = await callPatchLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedInUnpublishedSectionId,
        { isCompleted: true, incrementTime: 500 },
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.publishedInUnpublishedSectionId),
      );

      const after = await findProgress(
        fixture.enrollmentAId,
        fixture.publishedInUnpublishedSectionId,
      );
      expect(after?.timeSpent).toBe(200);
      expect(after?.isCompleted).toBe(false);
    });

    it('returns 404 for an unpublished lecture in a published section (A2) without creating progress', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentEmptyId);

      const response = await callPatchLectureProgressApi(
        fixture.courseSlug,
        fixture.unpublishedLectureId,
        { isCompleted: false, incrementTime: 10 },
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.unpublishedLectureId),
      );

      const progress = await findProgress(
        fixture.enrollmentEmptyId,
        fixture.unpublishedLectureId,
      );
      expect(progress).toBeNull();
    });

    it('returns 404 for an unpublished lecture in an unpublished section (B2) without mutating progress', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const before = await findProgress(
        fixture.enrollmentAId,
        fixture.unpublishedInUnpublishedSectionId,
      );
      expect(before?.timeSpent).toBe(888);

      const response = await callPatchLectureProgressApi(
        fixture.courseSlug,
        fixture.unpublishedInUnpublishedSectionId,
        { isCompleted: false, incrementTime: 100 },
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.unpublishedInUnpublishedSectionId),
      );

      const after = await findProgress(
        fixture.enrollmentAId,
        fixture.unpublishedInUnpublishedSectionId,
      );
      expect(after?.timeSpent).toBe(888);
    });

    it('returns 401 when authentication is missing', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setUnauthenticated();

      const response = await callPatchLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
        { isCompleted: false, incrementTime: 10 },
      );
      const body = await parseJson(response);

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Unauthorized');
    });

    it('returns 403 when the user lacks PROGRESS_UPDATE permission', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId, 'GUEST');

      const response = await callPatchLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
        { isCompleted: false, incrementTime: 10 },
      );
      const body = await parseJson(response);

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.message).toBe('ليس لديك صلاحية');
    });

    it('returns 403 for an unenrolled user', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.instructorId);

      const response = await callPatchLectureProgressApi(
        fixture.courseSlug,
        fixture.publishedLectureId,
        { isCompleted: false, incrementTime: 10 },
      );
      const body = await parseJson(response);

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.message).toBe(enrollmentAccessDeniedMessage());
    });

    it('returns 404 when the lecture belongs to a different course', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callPatchLectureProgressApi(
        fixture.courseSlug,
        fixture.foreignLectureId,
        { isCompleted: false, incrementTime: 10 },
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.foreignLectureId),
      );
    });

    describe('section + lecture publication edge case (A1 allowed, B1 blocked)', () => {
      it('allows PATCH A1 and blocks PATCH B1 for an enrolled student', async (ctx) => {
        if (!dbAvailable || !fixture) {
          ctx.skip();
          return;
        }

        setAuthenticatedUser(fixture.studentEmptyId);

        const a1Before = await findProgress(
          fixture.enrollmentEmptyId,
          fixture.publishedLectureId,
        );
        const b1Before = await findProgress(
          fixture.enrollmentEmptyId,
          fixture.publishedInUnpublishedSectionId,
        );
        expect(a1Before).toBeNull();
        expect(b1Before).toBeNull();

        const a1Response = await callPatchLectureProgressApi(
          fixture.courseSlug,
          fixture.publishedLectureId,
          { isCompleted: false, incrementTime: 15 },
        );
        const b1Response = await callPatchLectureProgressApi(
          fixture.courseSlug,
          fixture.publishedInUnpublishedSectionId,
          { isCompleted: false, incrementTime: 15 },
        );

        expect(a1Response.status).toBe(200);
        expect(b1Response.status).toBe(404);

        const a1After = await findProgress(
          fixture.enrollmentEmptyId,
          fixture.publishedLectureId,
        );
        const b1After = await findProgress(
          fixture.enrollmentEmptyId,
          fixture.publishedInUnpublishedSectionId,
        );
        expect(a1After?.timeSpent).toBe(15);
        expect(b1After).toBeNull();
      });
    });
  },
);
