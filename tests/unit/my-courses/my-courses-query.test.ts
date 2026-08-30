import { describe, expect, it } from 'vitest';

import { PROGRESS_FILTERS } from '@/constants/my-courses';
import {
  buildEnrollmentsApiSearchParams,
  getEnrollmentsApiQuery,
  MY_COURSES_PAGE_LIMIT,
} from '@/features/my-courses/listing/lib/my-courses-api-query';

describe('my-courses enrollments API query mapping', () => {
  it('maps listing params to GET /api/enrollments query', () => {
    expect(
      getEnrollmentsApiQuery({
        page: 2,
        search: 'React',
        sort: 'title_asc',
        progressFilter: PROGRESS_FILTERS.COMPLETED,
      }),
    ).toEqual({
      page: 2,
      limit: MY_COURSES_PAGE_LIMIT,
      search: 'React',
      sortBy: 'title',
      sortOrder: 'asc',
      progressState: 'completed',
    });
  });

  it('builds the enrollments API search string', () => {
    expect(
      buildEnrollmentsApiSearchParams({
        page: 1,
        search: 'JavaScript',
        sort: 'recent_enroll',
        progressFilter: PROGRESS_FILTERS.IN_PROGRESS,
      }),
    ).toBe(
      'page=1&limit=9&sortBy=enrolledAt&sortOrder=desc&search=JavaScript&progressState=in_progress',
    );
  });

  it('maps recent_access to lastAccessedAt desc', () => {
    expect(
      buildEnrollmentsApiSearchParams({
        page: 1,
        sort: 'recent_access',
      }),
    ).toBe('page=1&limit=9&sortBy=lastAccessedAt&sortOrder=desc');
  });

  it('omits progressState when progress filter is all', () => {
    expect(
      buildEnrollmentsApiSearchParams({
        page: 1,
        sort: 'title_desc',
      }),
    ).toBe('page=1&limit=9&sortBy=title&sortOrder=desc');
  });

  it('maps not_started to progressState=not_started', () => {
    expect(
      getEnrollmentsApiQuery({
        progressFilter: PROGRESS_FILTERS.NOT_STARTED,
      }).progressState,
    ).toBe('not_started');
  });
});
