import type { Metadata } from 'next';

import { APP_ROUTES } from '@/constants/enums';
import { createPageMetadata } from '@/lib/seo/create-page-metadata';
import { NOINDEX_FOLLOW, shouldIndexListing } from '@/lib/seo/indexing';

type CoursesListingMetadataParams = {
  page: number;
  search?: string;
  path?: string;
  level?: string;
  featured?: boolean;
  sort?: string;
};

const LISTING_TITLE = 'الدورات التدريبية';
const LISTING_DESCRIPTION =
  'اكتشف مجموعتنا الواسعة من الدورات التدريبية في البرمجة وتطوير الويب. تعلم من الخبراء وارتقِ بمسيرتك المهنية.';

export function buildCoursesListingMetadata(
  params: CoursesListingMetadataParams,
): Metadata {
  const pageSuffix = params.page > 1 ? ` - صفحة ${params.page}` : '';
  const pathSuffix = params.path ? ` في مسار ${params.path}` : '';
  const searchSuffix = params.search
    ? ` - نتائج البحث عن: ${params.search}`
    : '';

  const title = `${LISTING_TITLE}${pathSuffix}${searchSuffix}${pageSuffix}`;
  const description = params.path
    ? `تصفح أفضل دورات ${params.path} في إثرالكود. تعلم من الصفر حتى الاحتراف مع تطبيق عملي.`
    : LISTING_DESCRIPTION;

  const indexable = shouldIndexListing({
    page: params.page,
    search: params.search,
    filters: {
      path: params.path,
      level: params.level,
      featured: params.featured,
      sort: params.sort,
    },
  });

  return createPageMetadata({
    title,
    description,
    path: APP_ROUTES.COURSES,
    robots: indexable ? { index: true, follow: true } : NOINDEX_FOLLOW,
  });
}
