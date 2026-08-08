import type { PathListDTO } from '@/types/path/path.dto';
import type { GetPublicPathsResult } from '@/types/path/path.types';
import type {
  PathCatalogItem,
  PathCatalogResult,
} from '../dto/path-catalog.dto';
import type { PathDetailItem } from '../dto/path-detail.dto';
import type { PathDetailDTO } from '@/types/path/path.dto';

export function mapPathCatalogItemToListDTO(
  item: PathCatalogItem,
): PathListDTO {
  return item;
}

export function mapCatalogResultToGetPublicPathsResult(
  result: PathCatalogResult,
): GetPublicPathsResult {
  return {
    paths: result.paths.map(mapPathCatalogItemToListDTO),
    totalCount: result.pagination.total,
    totalPages: result.pagination.totalPages,
    currentPage: result.pagination.page,
  };
}

export function mapPathDetailItemToDTO(item: PathDetailItem): PathDetailDTO {
  return item;
}
