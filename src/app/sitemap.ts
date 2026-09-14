import { getAllCoursesForSitemap } from '@/features/courses/services/course.service';
import { getAllPathsForSitemap } from '@/features/learning-paths/services/path.queries';
import { env } from '@/config/env';
import { APP_ROUTES } from '@/constants/enums';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { isSeoIndexingEnabled } from '@/lib/seo/environment';
import { buildSitemapEntries } from '@/lib/seo/sitemap';
import { getSiteOrigin } from '@/lib/seo/urls';
import type { MetadataRoute } from 'next';

export const revalidate = 3600;

const STATIC_SITEMAP_PATHS = [
  PUBLIC_ROUTES.HOME,
  PUBLIC_ROUTES.COURSES,
  PUBLIC_ROUTES.LEARNING_PATHS,
  PUBLIC_ROUTES.CONTACT,
  PUBLIC_ROUTES.ABOUT,
  PUBLIC_ROUTES.PRIVACY,
  PUBLIC_ROUTES.TERMS,
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const indexingEnabled = isSeoIndexingEnabled({
    nodeEnv: env.NODE_ENV,
    origin,
  });

  if (!indexingEnabled) {
    return [];
  }

  try {
    const [courses, paths] = await Promise.all([
      getAllCoursesForSitemap(),
      getAllPathsForSitemap(),
    ]);

    return withHomepageLastModified(
      buildSitemapEntries({
        indexingEnabled: true,
        origin,
        staticPaths: STATIC_SITEMAP_PATHS,
        dynamicEntries: [
          ...courses.map((course: { slug: string; updatedAt: Date }) => ({
            path: `${APP_ROUTES.COURSES}/${course.slug}`,
            lastModified: course.updatedAt,
          })),
          ...paths.map((path: { slug: string; updatedAt: Date }) => ({
            path: `${APP_ROUTES.LEARNING_PATHS}/${path.slug}`,
            lastModified: path.updatedAt,
          })),
        ],
      }),
      origin,
    );
  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    return withHomepageLastModified(
      buildSitemapEntries({
        indexingEnabled: true,
        origin,
        staticPaths: STATIC_SITEMAP_PATHS,
        dynamicEntries: [],
      }),
      origin,
    );
  }
}

function withHomepageLastModified(
  entries: MetadataRoute.Sitemap,
  origin: string,
): MetadataRoute.Sitemap {
  const homepageUrl = origin.replace(/\/+$/, '');

  return entries.map((entry) =>
    entry.url === homepageUrl
      ? { ...entry, lastModified: new Date() }
      : entry,
  );
}
