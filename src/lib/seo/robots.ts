import type { MetadataRoute } from 'next';

export const ROBOTS_DISALLOW_PATHS = [
  '/admin/',
  '/instructor/',
  '/api/',
  '/auth/',
  '/payment/',
  '/success/',
  '/unauthorized/',
  '/my-courses/',
  '/cart',
  '/docs',
] as const;

export function buildRobotsConfig(input: {
  indexingEnabled: boolean;
  origin: string;
}): MetadataRoute.Robots {
  if (!input.indexingEnabled) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: `${input.origin}/sitemap.xml`,
  };
}
