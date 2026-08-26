export type {
  PathListItem,
  PathListPagination,
  PathListQuery,
  PathListResult,
  PathListTrackItem,
  PathViewer,
} from './dto/path-list.dto';

export type {
  PathDetailCourseItem,
  PathDetailItem,
  PathDetailResult,
  PathDetailSectionItem,
  PathDetailTrackItem,
} from './dto/path-detail.dto';

export { PathListError, PathDetailError } from './errors/path.errors';

export {
  PATHS_PAGE_LIMIT,
  parsePathSearchParams,
} from './lib/path-list-query';
export type { PathSearchParamsInput } from './lib/path-list-query';

export {
  buildPathVisibilityWhere,
  filterCourseForAudience,
  filterPathForAudience,
  filterTrackForAudience,
  resolvePublishedOnlyForListing,
} from './policies/path-visibility.policy';

export { listPaths } from './use-cases/list-paths.use-case';
export type { ListPathsInput } from './use-cases/list-paths.use-case';

export {
  getPaths,
  getPathsForFilters,
  PATHS_FILTER_LIMIT,
} from './use-cases/load-paths.use-case';

export { getPathDetail } from './use-cases/get-path-detail.use-case';
export type { GetPathDetailInput } from './use-cases/get-path-detail.use-case';

export { loadPathDetailBySlug } from './use-cases/load-path-detail.use-case';
export type { LoadPathDetailResult } from './use-cases/load-path-detail.use-case';
