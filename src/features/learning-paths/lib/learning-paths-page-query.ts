import type { GetPublicPathsParams } from '@/types/path/path.types';
import { PathCategoryDTO } from '@/types/path/path.dto';
import type { PathSortOption } from '@/types/path/path.types';

export type LearningPathsPageSearchParamsInput = {
  page?: string;
  search?: string;
  sort?: string;
  category?: string;
};

export type LearningPathsPageQuery = {
  page: number;
  sort: PathSortOption;
  search?: string;
  category?: PathCategoryDTO;
};

const SORT_VALUES = [
  'newest',
  'oldest',
  'title',
] as const satisfies readonly PathSortOption[];

const CATEGORY_VALUES = Object.values(PathCategoryDTO);

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

export function parseLearningPathsPageSearchParams(
  input: LearningPathsPageSearchParamsInput,
): LearningPathsPageQuery {
  const page = Number(input.page) || 1;
  const sort = parseSort(input.sort);
  const search = input.search?.trim() || undefined;
  const category = parseCategory(input.category);

  return {
    page,
    sort,
    search,
    category,
  };
}

export function learningPathsPageQueryToGetPublicPathsParams(
  query: LearningPathsPageQuery,
): GetPublicPathsParams {
  return {
    search: query.search,
    page: query.page,
    sort: query.sort,
    category: query.category,
  };
}
