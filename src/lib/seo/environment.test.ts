import { describe, expect, it } from 'vitest';

import { isSeoIndexingEnabled } from './environment';

describe('isSeoIndexingEnabled', () => {
  it('is enabled only for production hosts', () => {
    expect(
      isSeoIndexingEnabled({
        nodeEnv: 'production',
        origin: 'https://ithracode.com',
      }),
    ).toBe(true);
  });

  it('disables indexing on localhost and preview hosts', () => {
    expect(
      isSeoIndexingEnabled({
        nodeEnv: 'production',
        origin: 'http://localhost:3000',
      }),
    ).toBe(false);
    expect(
      isSeoIndexingEnabled({
        nodeEnv: 'production',
        origin: 'https://ithra-code-git-main.vercel.app',
      }),
    ).toBe(false);
  });

  it('disables indexing outside production', () => {
    expect(
      isSeoIndexingEnabled({
        nodeEnv: 'development',
        origin: 'https://ithracode.com',
      }),
    ).toBe(false);
  });
});
