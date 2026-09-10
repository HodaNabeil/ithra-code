import { describe, expect, it } from 'vitest';

import { shouldIndexListing } from './indexing';

describe('shouldIndexListing', () => {
  it('indexes the clean first page', () => {
    expect(shouldIndexListing({ page: 1 })).toBe(true);
  });

  it('does not index search, filters, or later pages', () => {
    expect(shouldIndexListing({ page: 2 })).toBe(false);
    expect(shouldIndexListing({ page: 1, search: 'react' })).toBe(false);
    expect(
      shouldIndexListing({
        page: 1,
        filters: { path: 'web-frontend' },
      }),
    ).toBe(false);
  });
});
