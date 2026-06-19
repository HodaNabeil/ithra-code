import type {
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  Currency,
} from '@prisma/client';
import type { SortOption } from '@/types/course/course.types';

export type CatalogViewer = {
  id: string;
  role?: string;
} | null;

export type CourseCatalogQuery = {
  page: number;
  limit: number;
  search?: string;
  sort?: SortOption;
  path?: string;
  level?: CourseLevel;
  featured?: boolean;
};

export type CourseCatalogPublicItem = {
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

export type CourseCatalogItem = CourseCatalogPublicItem & {
  isInCart: boolean;
  isPurchased: boolean;
};

export type CourseCatalogPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Cacheable catalog payload (no user-specific fields). */
export type CourseCatalogPublicResult = {
  items: CourseCatalogPublicItem[];
  pagination: CourseCatalogPagination;
};

export type CourseCatalogResult = {
  courses: CourseCatalogItem[];
  pagination: CourseCatalogPagination;
};

export type CatalogCacheScope = 'public' | 'admin' | `instructor:${string}`;
