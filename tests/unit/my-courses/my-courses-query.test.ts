import { describe, expect, it } from 'vitest';

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
      }),
    ).toEqual({
      page: 2,
      limit: MY_COURSES_PAGE_LIMIT,
      search: 'React',
      sortBy: 'title',
      sortOrder: 'asc',
    });
  });

  it('builds the enrollments API search string', () => {
    expect(
      buildEnrollmentsApiSearchParams({
        page: 1,
        search: 'JavaScript',
        sort: 'recent_enroll',
      }),
    ).toBe('page=1&limit=9&sortBy=enrolledAt&sortOrder=desc&search=JavaScript');
  });

  it('defaults to enrolledAt desc when sort is omitted', () => {
    expect(
      buildEnrollmentsApiSearchParams({
        page: 1,
      }),
    ).toBe('page=1&limit=9&sortBy=enrolledAt&sortOrder=desc');
  });

  it('maps title_desc sort', () => {
    expect(
      buildEnrollmentsApiSearchParams({
        page: 1,
        sort: 'title_desc',
      }),
    ).toBe('page=1&limit=9&sortBy=title&sortOrder=desc');
  });
});
