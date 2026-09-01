import type { PathCategoryDTO } from '@/types/path/path.dto';
import type { PathSortOption } from '@/types/path/path.types';

export type PathViewer = {
  id: string;
  role?: string;
} | null;

export type PathListQuery = {
  page: number;
  limit: number;
  search?: string;
  sort?: PathSortOption;
  category?: PathCategoryDTO;
};

export type PathListTrackItem = {
  id: string;
  title: string;
};

export type PathListItem = {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  summary: string | null;
  thumbnailUrl: string;
  category: PathCategoryDTO;
  icon: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  tracks: PathListTrackItem[];
};

export type PathListPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PathListResult = {
  paths: PathListItem[];
  pagination: PathListPagination;
};
