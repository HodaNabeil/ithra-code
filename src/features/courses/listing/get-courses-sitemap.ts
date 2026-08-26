import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { COURSE_TAGS } from '@/lib/query-keys';

const getAllCoursesForSitemapCached = cache(
  async () =>
    prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
  () => ['sitemap-courses'],
  {
    tags: [...COURSE_TAGS.course.all()],
    revalidate: 3600,
  },
);

export const getAllCoursesForSitemap = () => getAllCoursesForSitemapCached();
