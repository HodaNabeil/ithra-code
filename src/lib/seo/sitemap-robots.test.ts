import { describe, expect, it } from 'vitest';

import { buildRobotsConfig, ROBOTS_DISALLOW_PATHS } from './robots';
import { buildSitemapEntries } from './sitemap';

const origin = 'https://ithracode.com';

describe('robots', () => {
  it('allows public pages and lists the sitemap in production', () => {
    const robots = buildRobotsConfig({
      indexingEnabled: true,
      origin,
    });

    expect(robots.rules).toMatchObject({
      userAgent: '*',
      allow: '/',
    });
    expect(robots.sitemap).toBe(`${origin}/sitemap.xml`);
    expect(ROBOTS_DISALLOW_PATHS).toEqual(
      expect.arrayContaining(['/admin/', '/my-courses/', '/cart', '/docs']),
    );
  });

  it('blocks all crawlers and omits the sitemap off production', () => {
    const robots = buildRobotsConfig({
      indexingEnabled: false,
      origin: 'http://localhost:3000',
    });

    expect(robots.rules).toEqual({
      userAgent: '*',
      disallow: '/',
    });
    expect(robots.sitemap).toBeUndefined();
  });
});

describe('sitemap', () => {
  it('returns no URLs when indexing is disabled', () => {
    expect(
      buildSitemapEntries({
        indexingEnabled: false,
        origin,
        staticPaths: ['/', '/courses'],
        dynamicEntries: [{ path: '/courses/react' }],
      }),
    ).toEqual([]);
  });

  it('emits absolute URLs and lastmod only from real dates', () => {
    const updatedAt = new Date('2026-04-01T00:00:00.000Z');
    const entries = buildSitemapEntries({
      indexingEnabled: true,
      origin,
      staticPaths: ['/', '/courses'],
      dynamicEntries: [
        { path: '/courses/react', lastModified: updatedAt },
        { path: '/learning-paths/web' },
      ],
    });

    expect(entries).toEqual([
      { url: origin },
      { url: `${origin}/courses` },
      {
        url: `${origin}/courses/react`,
        lastModified: updatedAt,
      },
      { url: `${origin}/learning-paths/web` },
    ]);
    expect(entries.every((entry) => !('priority' in entry))).toBe(true);
    expect(entries.every((entry) => !('changeFrequency' in entry))).toBe(true);
  });
});
