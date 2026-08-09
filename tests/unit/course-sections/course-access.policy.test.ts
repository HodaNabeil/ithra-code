import { CourseStatus, Role } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  assertCourseSectionsAccessible,
  isStaffViewer,
  resolveCacheScope,
  resolvePublishedOnly,
} from '@/features/courses/course-sections/policies/course-access.policy';
import { CourseSectionsError } from '@/features/courses/course-sections/errors/course-sections.errors';
import type { CourseSectionsIdentity } from '@/features/courses/course-sections/dto/course-sections.dto';

const publishedCourse: CourseSectionsIdentity = {
  id: 'course-1',
  slug: 'nodejs-complete-guide',
  instructorId: 'instructor-1',
  status: CourseStatus.PUBLISHED,
};

const draftCourse: CourseSectionsIdentity = {
  ...publishedCourse,
  status: CourseStatus.DRAFT,
};

describe('course-access.policy', () => {
  describe('isStaffViewer', () => {
    it('returns true for admin', () => {
      expect(
        isStaffViewer(publishedCourse, { id: 'admin-1', role: Role.ADMIN }),
      ).toBe(true);
    });

    it('returns true for course owner instructor', () => {
      expect(
        isStaffViewer(publishedCourse, {
          id: 'instructor-1',
          role: Role.INSTRUCTOR,
        }),
      ).toBe(true);
    });

    it('returns false for non-owner instructor', () => {
      expect(
        isStaffViewer(publishedCourse, {
          id: 'other-instructor',
          role: Role.INSTRUCTOR,
        }),
      ).toBe(false);
    });

    it('returns false for anonymous viewer', () => {
      expect(isStaffViewer(publishedCourse, null)).toBe(false);
    });
  });

  describe('assertCourseSectionsAccessible', () => {
    it('allows published course for anonymous users', () => {
      expect(() =>
        assertCourseSectionsAccessible(
          publishedCourse,
          publishedCourse.slug,
          null,
        ),
      ).not.toThrow();
    });

    it('allows draft course for admin', () => {
      expect(() =>
        assertCourseSectionsAccessible(draftCourse, draftCourse.slug, {
          id: 'admin-1',
          role: Role.ADMIN,
        }),
      ).not.toThrow();
    });

    it('allows draft course for owner instructor', () => {
      expect(() =>
        assertCourseSectionsAccessible(draftCourse, draftCourse.slug, {
          id: 'instructor-1',
          role: Role.INSTRUCTOR,
        }),
      ).not.toThrow();
    });

    it('returns 404 for draft course accessed by anonymous user', () => {
      expect(() =>
        assertCourseSectionsAccessible(draftCourse, draftCourse.slug, null),
      ).toThrow(CourseSectionsError);

      try {
        assertCourseSectionsAccessible(draftCourse, draftCourse.slug, null);
      } catch (error) {
        expect(error).toBeInstanceOf(CourseSectionsError);
        expect((error as CourseSectionsError).status).toBe(404);
        expect((error as CourseSectionsError).message).toContain(
          draftCourse.slug,
        );
      }
    });

    it('returns 404 for archived course accessed by student', () => {
      const archivedCourse = {
        ...publishedCourse,
        status: CourseStatus.ARCHIVED,
      };

      expect(() =>
        assertCourseSectionsAccessible(archivedCourse, archivedCourse.slug, {
          id: 'student-1',
          role: Role.STUDENT,
        }),
      ).toThrow(CourseSectionsError);
    });
  });

  describe('resolvePublishedOnly', () => {
    it('returns false for staff viewers', () => {
      expect(
        resolvePublishedOnly(publishedCourse, {
          id: 'instructor-1',
          role: Role.INSTRUCTOR,
        }),
      ).toBe(false);
    });

    it('returns true for anonymous users', () => {
      expect(resolvePublishedOnly(publishedCourse, null)).toBe(true);
    });

    it('returns true for non-owner instructors', () => {
      expect(
        resolvePublishedOnly(publishedCourse, {
          id: 'other-instructor',
          role: Role.INSTRUCTOR,
        }),
      ).toBe(true);
    });
  });

  describe('resolveCacheScope', () => {
    it('returns staff scope for course owner', () => {
      expect(
        resolveCacheScope(publishedCourse, {
          id: 'instructor-1',
          role: Role.INSTRUCTOR,
        }),
      ).toBe('staff');
    });

    it('returns public scope for anonymous users', () => {
      expect(resolveCacheScope(publishedCourse, null)).toBe('public');
    });
  });
});
