import type { PathCategoryDTO } from '@/types/path/path.dto';
import type { PathSortOption } from '@/types/path/path.types';

export type PathViewer = {
  id: string;
  role?: string;
} | null;

export type PathCatalogQuery = {
  page: number;
  limit: number;
  search?: string;
  sort?: PathSortOption;
  category?: PathCategoryDTO;
};

export type PathCatalogTrackItem = {
  id: string;
  title: string;
};

export type PathCatalogItem = {
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
  tracks: PathCatalogTrackItem[];
};

export type PathCatalogPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PathCatalogResult = {
  paths: PathCatalogItem[];
  pagination: PathCatalogPagination;
};
