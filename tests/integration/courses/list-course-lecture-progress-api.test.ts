import { EnrollmentStatus, Role } from '@prisma/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ListCourseLectureProgressResponse } from '@/features/courses/lecture-progress/dto/lecture-progress.dto';
import { courseNotFoundMessage } from '@/features/courses/course-sections/errors/course-sections.errors';
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

import { GET } from '@/app/api/courses/[idOrSlug]/lectures/progress/route';

type ListCourseLectureProgressApiBody = {
  success: boolean;
  message: string;
  data?: ListCourseLectureProgressResponse;
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

async function callListCourseLectureProgressApi(courseIdOrSlug: string) {
  return GET(
    new Request(
      `http://localhost:3000/api/courses/${encodeURIComponent(courseIdOrSlug)}/lectures/progress`,
      { method: 'GET' },
    ),
    { params: Promise.resolve({ idOrSlug: courseIdOrSlug }) },
  );
}

async function parseJson(
  response: Response,
): Promise<ListCourseLectureProgressApiBody> {
  return response.json() as Promise<ListCourseLectureProgressApiBody>;
}

describe.skipIf(!isIntegrationEnabled)(
  'GET /api/courses/{courseIdOrSlug}/lectures/progress integration',
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

    it('returns 200 with stored progress rows for an ACTIVE enrollment', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callListCourseLectureProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('تم جلب تقدم محاضرات الدورة بنجاح');
      expect(body.data?.total).toBe(4);
      expect(body.data?.progress).toHaveLength(4);
      expect(body.data?.progress.every((row) => row.enrollmentId === fixture!.enrollmentAId)).toBe(
        true,
      );
    });

    it('returns 200 with stored progress rows for a COMPLETED enrollment', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      await prisma.enrollment.update({
        where: { id: fixture.enrollmentAId },
        data: {
          status: EnrollmentStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      setAuthenticatedUser(fixture.studentAId);

      const response = await callListCourseLectureProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.data?.total).toBe(4);
    });

    it('returns 200 with an empty list when enrolled but no progress rows exist', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentEmptyId);

      const response = await callListCourseLectureProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.data).toEqual({ progress: [], total: 0 });
    });

    it('returns 401 when authentication is missing', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setUnauthenticated();

      const response = await callListCourseLectureProgressApi(fixture.courseSlug);
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

      const response = await callListCourseLectureProgressApi(fixture.courseSlug);
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

      const response = await callListCourseLectureProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(courseNotFoundMessage(fixture.courseSlug));
      expect(body.data).toBeUndefined();
    });

    it('returns 404 for an ineligible DROPPED enrollment', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const droppedStudent = await prisma.user.create({
        data: {
          email: `dropped-list-student-${fixture.suffix}@test.local`,
          role: Role.STUDENT,
          name: 'Dropped List Student',
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

      const response = await callListCourseLectureProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.message).toBe(courseNotFoundMessage(fixture.courseSlug));

      await prisma.enrollment.deleteMany({
        where: { studentId: droppedStudent.id },
      });
      await prisma.user.delete({ where: { id: droppedStudent.id } });
    });

    it('returns 404 for an ineligible REVOKED enrollment', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const revokedStudent = await prisma.user.create({
        data: {
          email: `revoked-list-student-${fixture.suffix}@test.local`,
          role: Role.STUDENT,
          name: 'Revoked List Student',
        },
      });

      await prisma.enrollment.create({
        data: {
          studentId: revokedStudent.id,
          courseId: fixture.courseId,
          status: EnrollmentStatus.REVOKED,
        },
      });

      setAuthenticatedUser(revokedStudent.id);

      const response = await callListCourseLectureProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.message).toBe(courseNotFoundMessage(fixture.courseSlug));

      await prisma.enrollment.deleteMany({
        where: { studentId: revokedStudent.id },
      });
      await prisma.user.delete({ where: { id: revokedStudent.id } });
    });

    it('returns 404 for a nonexistent course', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const missingSlug = `missing-list-course-${fixture.suffix}`;
      setAuthenticatedUser(fixture.studentAId);

      const response = await callListCourseLectureProgressApi(missingSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.message).toBe(courseNotFoundMessage(missingSlug));
    });

    it('masks nonexistent course and inaccessible course with the same access-denied response', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const missingSlug = `missing-list-course-${fixture.suffix}`;
      setAuthenticatedUser(fixture.instructorId);

      const missingResponse = await callListCourseLectureProgressApi(missingSlug);
      const inaccessibleResponse = await callListCourseLectureProgressApi(
        fixture.courseSlug,
      );

      const missingBody = await parseJson(missingResponse);
      const inaccessibleBody = await parseJson(inaccessibleResponse);

      expect(missingResponse.status).toBe(inaccessibleResponse.status);
      expect(missingResponse.status).toBe(404);
      expect(missingBody.success).toBe(inaccessibleBody.success);
      expect(missingBody.success).toBe(false);
      expect(missingBody.data).toBeUndefined();
      expect(inaccessibleBody.data).toBeUndefined();
    });

    it('returns identical 404 responses for the same identifier whether the course is missing or the user lacks enrollment', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const probeSlug = `probe-list-course-${fixture.suffix}`;
      setAuthenticatedUser(fixture.studentAId);

      const missingResponse = await callListCourseLectureProgressApi(probeSlug);
      const missingBody = await parseJson(missingResponse);

      const probeCourse = await prisma.course.create({
        data: {
          instructorId: fixture.instructorId,
          pathId: fixture.pathId,
          title: `Probe List Course ${fixture.suffix}`,
          description: 'Probe course for list lecture progress access masking',
          slug: probeSlug,
          thumbnailUrl: 'https://example.com/thumb.jpg',
          price: 0,
          level: 'BEGINNER',
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          objectives: [],
          requirements: [],
          targetAudience: [],
          tags: [],
        },
      });

      const inaccessibleResponse =
        await callListCourseLectureProgressApi(probeSlug);
      const inaccessibleBody = await parseJson(inaccessibleResponse);

      expect(missingResponse.status).toBe(404);
      expect(inaccessibleResponse.status).toBe(404);
      expect(missingBody.message).toBe(inaccessibleBody.message);
      expect(missingBody.message).toBe(courseNotFoundMessage(probeSlug));
      expect(missingBody.success).toBe(false);
      expect(inaccessibleBody.success).toBe(false);
      expect(missingBody.data).toBeUndefined();
      expect(inaccessibleBody.data).toBeUndefined();

      await prisma.course.delete({ where: { id: probeCourse.id } });
    });

    it('resolves the course using a slug', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callListCourseLectureProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.data?.total).toBe(4);
    });

    it('resolves the course using a CUID', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callListCourseLectureProgressApi(fixture.courseId);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.data?.total).toBe(4);
    });

    it('does not return progress from another user', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callListCourseLectureProgressApi(fixture.courseSlug);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(
        body.data?.progress.every((row) => row.enrollmentId === fixture!.enrollmentAId),
      ).toBe(true);
      expect(
        body.data?.progress.some((row) => row.enrollmentId === fixture!.enrollmentBId),
      ).toBe(false);
    });

    it('denies access when the user is not enrolled in the requested course', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentBId);

      const response = await callListCourseLectureProgressApi(
        fixture.foreignCourseId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.message).toBe(courseNotFoundMessage(fixture.foreignCourseId));
    });
  },
);
