import { describe, expect, it } from 'vitest';

import {
  getOrganizationId,
  getWebsiteId,
  normalizePath,
  toAbsoluteAssetUrl,
  toCanonicalUrl,
} from './urls';

describe('seo urls', () => {
  const origin = 'https://ithracode.com';

  it('normalizes paths and strips query strings', () => {
    expect(normalizePath('/courses/?search=react#top')).toBe('/courses');
    expect(normalizePath('courses')).toBe('/courses');
    expect(normalizePath('/')).toBe('/');
  });

  it('builds canonical URLs without query parameters', () => {
    expect(toCanonicalUrl('/courses?search=react', origin)).toBe(
      'https://ithracode.com/courses',
    );
    expect(toCanonicalUrl('/', origin)).toBe(origin);
  });

  it('keeps query strings on absolute asset URLs', () => {
    expect(
      toAbsoluteAssetUrl(
        'https://images.unsplash.com/photo.jpg?w=1200',
        origin,
      ),
    ).toBe('https://images.unsplash.com/photo.jpg?w=1200');
    expect(toAbsoluteAssetUrl('/img/ithracode.png', origin)).toBe(
      'https://ithracode.com/img/ithracode.png',
    );
  });

  it('builds stable entity ids', () => {
    expect(getOrganizationId(origin)).toBe(
      'https://ithracode.com/#organization',
    );
    expect(getWebsiteId(origin)).toBe('https://ithracode.com/#website');
  });
});
