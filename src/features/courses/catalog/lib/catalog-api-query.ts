import { CourseLevel } from '@prisma/client';
import type { SortOption } from '@/types/course/course.types';
import type { CourseCatalogQuery } from '../dto/course-catalog.dto';
import { COURSES_PAGE_LIMIT } from './catalog-query';

const SORT_VALUES = [
  'newest',
  'oldest',
  'price_asc',
  'price_desc',
] as const satisfies readonly SortOption[];

const LEVEL_VALUES = Object.values(CourseLevel);

export type CourseCatalogSearchParamsInput = {
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  path?: string;
  category?: string;
  level?: string;
  featured?: string;
};

function parseSort(raw: string | undefined): SortOption {
  if (raw && (SORT_VALUES as readonly string[]).includes(raw)) {
    return raw as SortOption;
  }
  return 'newest';
}

function parseLevel(raw: string | undefined): CourseLevel | undefined {
  if (!raw?.trim()) return undefined;
  if ((LEVEL_VALUES as string[]).includes(raw)) {
    return raw as CourseLevel;
  }
  return undefined;
}

function parseLimit(raw: string | undefined): number {
  const limit = Number(raw);
  if (!Number.isFinite(limit) || limit < 1) {
    return COURSES_PAGE_LIMIT;
  }
  return Math.min(Math.floor(limit), 50);
}

function parseFeatured(raw: string | undefined): boolean | undefined {
  if (!raw?.trim()) return undefined;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return undefined;
}

export function parseCourseCatalogSearchParams(
  input: CourseCatalogSearchParamsInput,
): CourseCatalogQuery {
  return {
    page: Math.max(1, Number(input.page) || 1),
    limit: parseLimit(input.limit),
    search: input.search?.trim() || undefined,
    sort: parseSort(input.sort),
    path: input.path?.trim() || input.category?.trim() || undefined,
    level: parseLevel(input.level),
    featured: parseFeatured(input.featured),
  };
}
