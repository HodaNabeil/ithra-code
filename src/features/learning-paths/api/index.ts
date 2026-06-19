export type {
  PathCatalogItem,
  PathCatalogPagination,
  PathCatalogQuery,
  PathCatalogResult,
  PathCatalogTrackItem,
  PathViewer,
} from './dto/path-catalog.dto';

export type {
  PathDetailCourseItem,
  PathDetailItem,
  PathDetailResult,
  PathDetailSectionItem,
  PathDetailTrackItem,
} from './dto/path-detail.dto';

export { PathCatalogError, PathDetailError } from './errors/path.errors';

export {
  PATHS_PAGE_LIMIT,
  parsePathCatalogSearchParams,
} from './lib/path-catalog-query';
export type { PathCatalogSearchParamsInput } from './lib/path-catalog-query';

export {
  buildPathVisibilityWhere,
  filterCourseForAudience,
  filterPathForAudience,
  filterTrackForAudience,
  resolvePublishedOnlyForCatalog,
} from './policies/path-visibility.policy';

export { getPathCatalog } from './use-cases/get-path-catalog.use-case';
export type { GetPathCatalogInput } from './use-cases/get-path-catalog.use-case';

export {
  getPaths,
  getPathsForFilters,
  PATHS_FILTER_LIMIT,
} from './use-cases/load-path-catalog.use-case';

export { getPathDetail } from './use-cases/get-path-detail.use-case';
export type { GetPathDetailInput } from './use-cases/get-path-detail.use-case';

export {
  loadPathDetailBySlug,
} from './use-cases/load-path-detail.use-case';
export type { LoadPathDetailResult } from './use-cases/load-path-detail.use-case';
