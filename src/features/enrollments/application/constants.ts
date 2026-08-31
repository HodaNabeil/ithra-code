import { EnrollmentStatus } from '@prisma/client';

export const MAX_ENROLLMENTS_PER_STUDENT = 500;

export const ENROLLMENTS_DEFAULT_PAGE = 1;
export const ENROLLMENTS_DEFAULT_LIMIT = 10;
export const ENROLLMENTS_MAX_LIMIT = 100;

export const DEFAULT_ENROLLMENT_STATUSES = [
  EnrollmentStatus.ACTIVE,
  EnrollmentStatus.COMPLETED,
] as const;

export const ENROLLMENT_LIST_SORT_BY = ['enrolledAt', 'title'] as const;
export const ENROLLMENT_LIST_SORT_ORDER = ['asc', 'desc'] as const;
export const ENROLLMENT_LIST_STATUS = [
  EnrollmentStatus.ACTIVE,
  EnrollmentStatus.COMPLETED,
] as const;

export type EnrollmentListSortBy = (typeof ENROLLMENT_LIST_SORT_BY)[number];
export type EnrollmentListSortOrder =
  (typeof ENROLLMENT_LIST_SORT_ORDER)[number];
export type EnrollmentListStatusFilter =
  (typeof ENROLLMENT_LIST_STATUS)[number];
