import type { MetadataRoute } from 'next';

export type SitemapDynamicEntry = {
  path: string;
  lastModified?: Date;
};

export function buildSitemapEntries(input: {
  indexingEnabled: boolean;
  origin: string;
  staticPaths: readonly string[];
  dynamicEntries: SitemapDynamicEntry[];
}): MetadataRoute.Sitemap {
  if (!input.indexingEnabled) {
    return [];
  }

  const origin = input.origin.replace(/\/+$/, '');

  const staticEntries: MetadataRoute.Sitemap = input.staticPaths.map(
    (path) => ({
      url: path === '/' ? origin : `${origin}${path}`,
    }),
  );

  const dynamicEntries: MetadataRoute.Sitemap = input.dynamicEntries.map(
    (entry) => ({
      url: `${origin}${entry.path}`,
      ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
    }),
  );

  return [...staticEntries, ...dynamicEntries];
}
