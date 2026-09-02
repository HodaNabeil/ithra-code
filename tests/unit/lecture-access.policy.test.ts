import { CourseStatus, Role } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  assertLecturePaidAccess,
  assertLecturePublishedContent,
  computeHasPurchased,
} from '@/features/courses/lecture-detail/policies/lecture-access.policy';
import { LectureDetailError } from '@/features/courses/lecture-detail/errors/lecture-detail.errors';

const lectureId = 'clecture00000000000000001';
const course = {
  id: 'ccourse00000000000000001',
  instructorId: 'cinstructor0000000000001',
  status: CourseStatus.PUBLISHED,
};
const publishedLecture = { isPublished: true, isFree: false };
const unpublishedLecture = { isPublished: false, isFree: false };
const freeLecture = { isPublished: true, isFree: true };

const student = { id: 'cstudent000000000000001', role: Role.STUDENT };
const instructor = {
  id: 'cinstructor0000000000001',
  role: Role.INSTRUCTOR,
};
const admin = { id: 'cadmin0000000000000001', role: Role.ADMIN };
const otherStudent = { id: 'cstudent000000000000002', role: Role.STUDENT };

const activeEnrollment = { id: 'cenrollment0000000000001' };

describe('assertLecturePublishedContent', () => {
  it('allows admin to access unpublished lecture', () => {
    expect(() =>
      assertLecturePublishedContent(
        { ...course, status: CourseStatus.DRAFT },
        unpublishedLecture,
        lectureId,
        admin,
      ),
    ).not.toThrow();
  });

  it('allows owning instructor to access unpublished lecture', () => {
    expect(() =>
      assertLecturePublishedContent(
        { ...course, status: CourseStatus.DRAFT },
        unpublishedLecture,
        lectureId,
        instructor,
      ),
    ).not.toThrow();
  });

  it('returns 404 for student on unpublished course', () => {
    expect(() =>
      assertLecturePublishedContent(
        { ...course, status: CourseStatus.DRAFT },
        publishedLecture,
        lectureId,
        student,
      ),
    ).toThrow(LectureDetailError);

    try {
      assertLecturePublishedContent(
        { ...course, status: CourseStatus.DRAFT },
        publishedLecture,
        lectureId,
        student,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(LectureDetailError);
      expect((error as LectureDetailError).status).toBe(404);
    }
  });

  it('returns 404 for student on unpublished lecture', () => {
    expect(() =>
      assertLecturePublishedContent(
        course,
        unpublishedLecture,
        lectureId,
        student,
      ),
    ).toThrow(LectureDetailError);
  });

  it('allows student on published course and lecture', () => {
    expect(() =>
      assertLecturePublishedContent(
        course,
        publishedLecture,
        lectureId,
        student,
      ),
    ).not.toThrow();
  });
});

describe('assertLecturePaidAccess', () => {
  it('allows admin without enrollment', () => {
    expect(() =>
      assertLecturePaidAccess(course, publishedLecture, admin, null),
    ).not.toThrow();
  });

  it('allows course instructor without enrollment', () => {
    expect(() =>
      assertLecturePaidAccess(course, publishedLecture, instructor, null),
    ).not.toThrow();
  });

  it('allows any authenticated user for free lecture', () => {
    expect(() =>
      assertLecturePaidAccess(course, freeLecture, otherStudent, null),
    ).not.toThrow();
  });

  it('allows student with active enrollment', () => {
    expect(() =>
      assertLecturePaidAccess(
        course,
        publishedLecture,
        student,
        activeEnrollment,
      ),
    ).not.toThrow();
  });

  it('returns 403 when student has no enrollment for paid lecture', () => {
    expect(() =>
      assertLecturePaidAccess(course, publishedLecture, student, null),
    ).toThrow(LectureDetailError);

    try {
      assertLecturePaidAccess(course, publishedLecture, student, null);
    } catch (error) {
      expect((error as LectureDetailError).status).toBe(403);
      expect((error as LectureDetailError).code).toBe(
        'LECTURE_PURCHASE_REQUIRED',
      );
    }
  });
});

describe('computeHasPurchased', () => {
  it('returns true for admin', () => {
    expect(computeHasPurchased(course, admin, null)).toBe(true);
  });

  it('returns true for course instructor', () => {
    expect(computeHasPurchased(course, instructor, null)).toBe(true);
  });

  it('returns true for student with valid enrollment', () => {
    expect(computeHasPurchased(course, student, activeEnrollment)).toBe(true);
  });

  it('returns false for student without enrollment', () => {
    expect(computeHasPurchased(course, student, null)).toBe(false);
  });

  it('returns false for free lecture without enrollment', () => {
    expect(computeHasPurchased(course, otherStudent, null)).toBe(false);
  });
});
