import { CourseStatus, Role } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { LectureDetailError } from '@/features/courses/lecture-detail/errors/lecture-detail.errors';
import {
  assertLecturePaidAccess,
  assertLecturePublishedContent,
  computeHasPurchased,
} from '@/features/courses/lecture-detail/policies/lecture-access.policy';

const lectureId = 'claaaaaaaaaaaaaaaaaaaaaa0';

const publishedCourse = {
  id: 'claaaaaaaaaaaaaaaaaaaaaa1',
  instructorId: 'claaaaaaaaaaaaaaaaaaaaaa2',
  status: CourseStatus.PUBLISHED,
};

const draftCourse = {
  ...publishedCourse,
  status: CourseStatus.DRAFT,
};

const publishedLecture = { isPublished: true, isFree: false };
const unpublishedLecture = { isPublished: false, isFree: false };
const freeLecture = { isPublished: true, isFree: true };

describe('lecture-access.policy', () => {
  describe('assertLecturePublishedContent', () => {
    it('allows admin to view unpublished lecture on draft course', () => {
      expect(() =>
        assertLecturePublishedContent(
          draftCourse,
          unpublishedLecture,
          lectureId,
          { id: 'admin-1', role: Role.ADMIN },
        ),
      ).not.toThrow();
    });

    it('allows owner instructor to view unpublished lecture', () => {
      expect(() =>
        assertLecturePublishedContent(
          draftCourse,
          unpublishedLecture,
          lectureId,
          {
            id: publishedCourse.instructorId,
            role: Role.INSTRUCTOR,
          },
        ),
      ).not.toThrow();
    });

    it('allows student to view published lecture on published course', () => {
      expect(() =>
        assertLecturePublishedContent(
          publishedCourse,
          publishedLecture,
          lectureId,
          { id: 'student-1', role: Role.STUDENT },
        ),
      ).not.toThrow();
    });

    it('returns 404 for unpublished lecture accessed by student', () => {
      expect(() =>
        assertLecturePublishedContent(
          publishedCourse,
          unpublishedLecture,
          lectureId,
          { id: 'student-1', role: Role.STUDENT },
        ),
      ).toThrow(LectureDetailError);

      try {
        assertLecturePublishedContent(
          publishedCourse,
          unpublishedLecture,
          lectureId,
          { id: 'student-1', role: Role.STUDENT },
        );
      } catch (error) {
        expect((error as LectureDetailError).status).toBe(404);
        expect((error as LectureDetailError).message).toContain(lectureId);
      }
    });

    it('returns 404 for draft course accessed by student', () => {
      expect(() =>
        assertLecturePublishedContent(
          draftCourse,
          publishedLecture,
          lectureId,
          { id: 'student-1', role: Role.STUDENT },
        ),
      ).toThrow(LectureDetailError);
    });
  });

  describe('assertLecturePaidAccess', () => {
    it('allows admin without enrollment', () => {
      expect(() =>
        assertLecturePaidAccess(
          publishedCourse,
          publishedLecture,
          { id: 'admin-1', role: Role.ADMIN },
          null,
        ),
      ).not.toThrow();
    });

    it('allows course instructor without enrollment', () => {
      expect(() =>
        assertLecturePaidAccess(
          publishedCourse,
          publishedLecture,
          {
            id: publishedCourse.instructorId,
            role: Role.INSTRUCTOR,
          },
          null,
        ),
      ).not.toThrow();
    });

    it('allows free lecture without enrollment', () => {
      expect(() =>
        assertLecturePaidAccess(
          publishedCourse,
          freeLecture,
          { id: 'student-1', role: Role.STUDENT },
          null,
        ),
      ).not.toThrow();
    });

    it('allows paid lecture with ACTIVE enrollment', () => {
      expect(() =>
        assertLecturePaidAccess(
          publishedCourse,
          publishedLecture,
          { id: 'student-1', role: Role.STUDENT },
          { id: 'enrollment-1', status: 'ACTIVE' },
        ),
      ).not.toThrow();
    });

    it('returns 403 for paid lecture without enrollment', () => {
      expect(() =>
        assertLecturePaidAccess(
          publishedCourse,
          publishedLecture,
          { id: 'student-1', role: Role.STUDENT },
          null,
        ),
      ).toThrow(LectureDetailError);

      try {
        assertLecturePaidAccess(
          publishedCourse,
          publishedLecture,
          { id: 'student-1', role: Role.STUDENT },
          null,
        );
      } catch (error) {
        expect((error as LectureDetailError).status).toBe(403);
        expect((error as LectureDetailError).message).toBe(
          'يجب شراء هذه الدورة للوصول إلى محاضراتها',
        );
      }
    });

    it('returns 403 for paid lecture with DROPPED enrollment', () => {
      expect(() =>
        assertLecturePaidAccess(
          publishedCourse,
          publishedLecture,
          { id: 'student-1', role: Role.STUDENT },
          { id: 'enrollment-1', status: 'DROPPED' },
        ),
      ).toThrow(LectureDetailError);
    });
  });

  describe('computeHasPurchased', () => {
    it('returns true for admin', () => {
      expect(
        computeHasPurchased(
          publishedCourse,
          { id: 'admin-1', role: Role.ADMIN },
          null,
        ),
      ).toBe(true);
    });

    it('returns true for course instructor', () => {
      expect(
        computeHasPurchased(
          publishedCourse,
          {
            id: publishedCourse.instructorId,
            role: Role.INSTRUCTOR,
          },
          null,
        ),
      ).toBe(true);
    });

    it('returns true for ACTIVE enrollment', () => {
      expect(
        computeHasPurchased(
          publishedCourse,
          { id: 'student-1', role: Role.STUDENT },
          { id: 'enrollment-1', status: 'ACTIVE' },
        ),
      ).toBe(true);
    });

    it('returns false for free lecture without enrollment', () => {
      expect(
        computeHasPurchased(
          publishedCourse,
          { id: 'student-1', role: Role.STUDENT },
          null,
        ),
      ).toBe(false);
    });
  });
});
