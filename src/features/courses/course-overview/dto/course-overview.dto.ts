import type { CourseLevel, CourseStatus, CourseVisibility } from '@prisma/client';

export type CourseOverviewDTO = {
  totalHours: number;
  totalStudents: number;
  rating: number;
  ratingsCount: number;
  lastUpdated: string;
  lecturesCount: number;
  skillLevel: string;
  description: string;
};

export type GetCourseOverviewResponse = {
  overview: CourseOverviewDTO;
};

export type CourseOverviewCacheScope = 'public' | 'staff';

export type CourseOverviewIdentity = {
  id: string;
  slug: string;
  instructorId: string;
  description: string;
  level: CourseLevel;
  updatedAt: Date;
  status: CourseStatus;
  visibility: CourseVisibility;
};

export type CourseOverviewAggregates = {
  totalVideoDurationSeconds: number;
  totalStudents: number;
  averageRating: number | null;
  ratingsCount: number;
  lecturesCount: number;
};

export type CourseOverviewRecord = CourseOverviewIdentity & CourseOverviewAggregates;
