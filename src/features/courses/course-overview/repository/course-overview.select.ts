import type { CourseLevel, CourseStatus, CourseVisibility } from '@prisma/client';

export const courseOverviewIdentitySelect = {
  id: true,
  slug: true,
  instructorId: true,
  description: true,
  level: true,
  updatedAt: true,
  status: true,
  visibility: true,
} as const;

export type DB_CourseOverviewIdentity = {
  id: string;
  slug: string;
  instructorId: string;
  description: string;
  level: CourseLevel;
  updatedAt: Date;
  status: CourseStatus;
  visibility: CourseVisibility;
};
