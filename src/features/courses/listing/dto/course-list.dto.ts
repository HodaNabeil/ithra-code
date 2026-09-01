import type {
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  Currency,
} from '@prisma/client';
import type { SortOption } from '@/types/course/course.types';

export type CourseViewer = {
  id: string;
  role?: string;
} | null;

export type CourseListQuery = {
  page: number;
  limit: number;
  search?: string;
  sort?: SortOption;
  path?: string;
  level?: CourseLevel;
  featured?: boolean;
};

export type CourseListPublicItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  price: number;
  compareAtPrice: number | null;
  currency: Currency;
  duration: number | null;
  level: string;
  objectives: string[];
  rating: number;
  ratingCount: number;
  lecturesCount: number;
  hours: number | null;
  firstLectureId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  status: CourseStatus;
  visibility: CourseVisibility;
  instructorId: string;
};

export type CourseListItem = CourseListPublicItem & {
  isInCart: boolean;
  isPurchased: boolean;
};

export type CourseListPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Cacheable listing payload (no user-specific fields). */
export type CourseListPublicResult = {
  items: CourseListPublicItem[];
  pagination: CourseListPagination;
};

export type CourseListResult = {
  courses: CourseListItem[];
  pagination: CourseListPagination;
};

export type CourseListCacheScope = 'public' | 'admin' | `instructor:${string}`;
