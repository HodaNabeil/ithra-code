import type { CourseStatus } from '@prisma/client';

export type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  status: CourseStatus;
  instructorId: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseArchiveUpdate = {
  status: CourseStatus;
  archivedAt: Date;
};
