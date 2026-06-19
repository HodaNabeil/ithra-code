import type { SortOption } from '@/types/course/course.types';
import { CourseLevel } from '@prisma/client';

/** Raw searchParams shape from Next.js `page.tsx`. */
export type CoursesPageSearchParamsInput = {
  page?: string;
  search?: string;
  sort?: string;
  path?: string;
  level?: string;
  featured?: string;
};

export type CoursesPageQuery = {
  page: number;
  sort: SortOption;
  search?: string;
  path?: string;
  level?: CourseLevel;
  featured?: boolean;
};

const SORT_VALUES = [
  'newest',
  'oldest',
  'price_asc',
  'price_desc',
] as const satisfies readonly SortOption[];

function parseSort(raw: string | undefined): SortOption {
  if (raw && (SORT_VALUES as readonly string[]).includes(raw)) {
    return raw as SortOption;
  }
  return 'newest';
}

function parseLevel(raw: string | undefined): CourseLevel | undefined {
  if (!raw || raw === CourseLevel.ALL_LEVELS) {
    return undefined;
  }

  if ((Object.values(CourseLevel) as string[]).includes(raw)) {
    return raw as CourseLevel;
  }

  return undefined;
}

function parseFeatured(raw: string | undefined): boolean | undefined {
  if (raw === 'true' || raw === '1') {
    return true;
  }

  return undefined;
}

export function parseCoursesPageSearchParams(
  input: CoursesPageSearchParamsInput,
): CoursesPageQuery {
  const page = Number(input.page) || 1;
  const sort = parseSort(input.sort);
  const search = input.search?.trim() || undefined;
  const path = input.path?.trim() || undefined;
  const level = parseLevel(input.level?.trim());
  const featured = parseFeatured(input.featured?.trim());

  return {
    page,
    sort,
    search,
    path,
    level,
    featured,
  };
}
