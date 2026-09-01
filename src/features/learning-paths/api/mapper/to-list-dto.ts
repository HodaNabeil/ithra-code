import type { PathListDTO } from '@/types/path/path.dto';
import type { GetPublicPathsResult } from '@/types/path/path.types';
import type { PathListItem, PathListResult } from '../dto/path-list.dto';
import type { PathDetailItem } from '../dto/path-detail.dto';
import type { PathDetailDTO } from '@/types/path/path.dto';

export function mapPathListItemToListDTO(item: PathListItem): PathListDTO {
  return item;
}

export function mapPathListResultToGetPublicPathsResult(
  result: PathListResult,
): GetPublicPathsResult {
  return {
    paths: result.paths.map(mapPathListItemToListDTO),
    totalCount: result.pagination.total,
    totalPages: result.pagination.totalPages,
    currentPage: result.pagination.page,
  };
}

export function mapPathDetailItemToDTO(item: PathDetailItem): PathDetailDTO {
  return item;
}
