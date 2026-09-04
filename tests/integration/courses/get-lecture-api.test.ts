import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GetLectureResponse } from '@/features/courses/lecture-detail';
import { lectureNotFoundMessage } from '@/features/courses/lecture-detail';

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

import { GET } from '@/app/api/lectures/[lectureId]/route';

type LectureApiBody = {
  success: boolean;
  message: string;
  data?: GetLectureResponse;
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

async function callGetLectureApi(lectureId: string) {
  return GET(
    new Request(`http://localhost:3000/api/lectures/${lectureId}`, {
      method: 'GET',
    }),
    { params: Promise.resolve({ lectureId }) },
  );
}

async function parseJson(response: Response): Promise<LectureApiBody> {
  return response.json() as Promise<LectureApiBody>;
}

/**
 * Student lecture access rule:
 *   section.isPublished === true  AND  lecture.isPublished === true
 */
describe.skipIf(!isIntegrationEnabled)(
  'GET /api/lectures/{lectureId} integration',
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

    it('returns 200 for a published lecture in a published section (A1)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureApi(fixture.publishedLectureId);
      const body = await parseJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data?.lecture.id).toBe(fixture.publishedLectureId);
    });

    it('returns 404 for an unpublished lecture in a published section (A2)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureApi(fixture.unpublishedLectureId);
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.unpublishedLectureId),
      );
    });

    it('returns 404 for a published lecture in an unpublished section (B1)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureApi(
        fixture.publishedInUnpublishedSectionId,
      );
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(
        lectureNotFoundMessage(fixture.publishedInUnpublishedSectionId),
      );
    });

    it('returns 404 for an unpublished lecture in an unpublished section (B2)', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureApi(
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

      const response = await callGetLectureApi(fixture.publishedLectureId);
      const body = await parseJson(response);

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Unauthorized');
    });

    it('returns 403 when the user lacks LECTURE_READ permission', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      setAuthenticatedUser(fixture.studentAId, 'GUEST');

      const response = await callGetLectureApi(fixture.publishedLectureId);
      const body = await parseJson(response);

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.message).toBe('ليس لديك صلاحية');
    });

    it('returns 404 for a nonexistent lecture', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const missingLectureId = 'clzzzzzzzzzzzzzzzzzzzzzzz';
      setAuthenticatedUser(fixture.studentAId);

      const response = await callGetLectureApi(missingLectureId);
      const body = await parseJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe(lectureNotFoundMessage(missingLectureId));
    });

    describe('section + lecture publication edge case (A1 visible, B1 blocked)', () => {
      it('allows GET A1 and blocks GET B1 for an enrolled student', async (ctx) => {
        if (!dbAvailable || !fixture) {
          ctx.skip();
          return;
        }

        setAuthenticatedUser(fixture.studentAId);

        const a1Response = await callGetLectureApi(fixture.publishedLectureId);
        const b1Response = await callGetLectureApi(
          fixture.publishedInUnpublishedSectionId,
        );

        expect(a1Response.status).toBe(200);
        expect(b1Response.status).toBe(404);
      });
    });
  },
);
