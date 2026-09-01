import { PathCategoryDTO } from '@/types/path/path.dto';
import type { PathSortOption } from '@/types/path/path.types';
import type { PathListQuery } from '../dto/path-list.dto';

export const PATHS_PAGE_LIMIT = 9;

const SORT_VALUES = [
  'newest',
  'oldest',
  'title',
] as const satisfies readonly PathSortOption[];

const CATEGORY_VALUES = Object.values(PathCategoryDTO);

export type PathSearchParamsInput = {
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  category?: string;
};

function parseSort(raw: string | undefined): PathSortOption {
  if (raw && (SORT_VALUES as readonly string[]).includes(raw)) {
    return raw as PathSortOption;
  }
  return 'newest';
}

function parseCategory(raw: string | undefined): PathCategoryDTO | undefined {
  if (!raw?.trim()) return undefined;
  if (CATEGORY_VALUES.includes(raw as PathCategoryDTO)) {
    return raw as PathCategoryDTO;
  }
  return undefined;
}

function parseLimit(raw: string | undefined): number {
  const limit = Number(raw);
  if (!Number.isFinite(limit) || limit < 1) {
    return PATHS_PAGE_LIMIT;
  }
  return Math.min(Math.floor(limit), 50);
}

export function parsePathSearchParams(
  input: PathSearchParamsInput,
): PathListQuery {
  return {
    page: Math.max(1, Number(input.page) || 1),
    limit: parseLimit(input.limit),
    search: input.search?.trim() || undefined,
    sort: parseSort(input.sort),
    category: parseCategory(input.category),
  };
}
