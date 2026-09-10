export type ListingIndexParams = {
  page?: number;
  search?: string | null;
  filters?: Record<string, string | number | boolean | undefined | null>;
};

function hasActiveFilter(filters: ListingIndexParams['filters']): boolean {
  if (!filters) {
    return false;
  }

  return Object.values(filters).some((value) => {
    if (value == null || value === '') {
      return false;
    }
    if (value === false) {
      return false;
    }
    return true;
  });
}

export function shouldIndexListing(params: ListingIndexParams): boolean {
  if ((params.page ?? 1) > 1) {
    return false;
  }

  if (params.search?.trim()) {
    return false;
  }

  return !hasActiveFilter(params.filters);
}

export const INDEX_FOLLOW = {
  index: true,
  follow: true,
} as const;

export const NOINDEX_FOLLOW = {
  index: false,
  follow: true,
} as const;

export const NOINDEX_NOFOLLOW = {
  index: false,
  follow: false,
} as const;
