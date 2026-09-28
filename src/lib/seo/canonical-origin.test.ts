import { describe, expect, it, vi } from 'vitest';

vi.mock('./environment', () => ({
  isSeoIndexingEnabled: vi.fn(),
}));

import { getCanonicalOrigin } from './canonical-origin';
import { SEO_CANONICAL_ORIGIN } from './config';
import { isSeoIndexingEnabled } from './environment';

describe('getCanonicalOrigin', () => {
  it('returns the production canonical origin when indexing is enabled', () => {
    vi.mocked(isSeoIndexingEnabled).mockReturnValue(true);

    expect(getCanonicalOrigin('https://ithracode.tech')).toBe(
      SEO_CANONICAL_ORIGIN,
    );
  });

  it('returns the app origin when indexing is disabled', () => {
    vi.mocked(isSeoIndexingEnabled).mockReturnValue(false);

    expect(getCanonicalOrigin('http://localhost:3000')).toBe(
      'http://localhost:3000',
    );
  });

  it('strips trailing slashes from the app origin', () => {
    vi.mocked(isSeoIndexingEnabled).mockReturnValue(false);

    expect(getCanonicalOrigin('http://localhost:3000/')).toBe(
      'http://localhost:3000',
    );
  });
});
