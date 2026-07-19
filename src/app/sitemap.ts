import { getAllCoursesForSitemap } from '@/features/courses/services/course.service';
import { getAllPathsForSitemap } from '@/features/learning-paths/services/path.queries';
import { env } from '@/config/env';
import { APP_ROUTES } from '@/constants/enums';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const currentDate = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}${APP_ROUTES.COURSES}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}${APP_ROUTES.LEARNING_PATHS}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}${APP_ROUTES.CONTACT}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const [courses, paths] = await Promise.all([
      getAllCoursesForSitemap(),
      getAllPathsForSitemap(),
    ]);

    const courseUrls: MetadataRoute.Sitemap = courses.map(
      (course: { slug: string; updatedAt: Date }) => ({
        url: `${baseUrl}${APP_ROUTES.COURSES}/${course.slug}`,
        lastModified: course.updatedAt
          ? new Date(course.updatedAt)
          : currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }),
    );

    const pathUrls: MetadataRoute.Sitemap = paths.map(
      (path: { slug: string; updatedAt: Date }) => ({
        url: `${baseUrl}${APP_ROUTES.LEARNING_PATHS}/${path.slug}`,
        lastModified: path.updatedAt ? new Date(path.updatedAt) : currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }),
    );

    return [...staticPages, ...courseUrls, ...pathUrls];
  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    return staticPages;
  }
}
