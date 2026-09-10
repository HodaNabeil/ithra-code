import type { Metadata } from 'next';

import { APP_ROUTES } from '@/constants/enums';
import type { LearningPathsPageQuery } from '@/features/learning-paths/lib/learning-paths-page-query';
import { createPageMetadata } from '@/lib/seo/create-page-metadata';
import { NOINDEX_FOLLOW, shouldIndexListing } from '@/lib/seo/indexing';

const LISTING_TITLE = 'المسارات التعليمية';
const LISTING_DESCRIPTION =
  'اكتشف المسارات التعليمية المصممة بعناية لتمكينك من إتقان البرمجة وتطوير البرمجيات. ابدأ رحلتك الآن مع إثرالكود.';

export function buildLearningPathsListingMetadata(
  query: LearningPathsPageQuery,
): Metadata {
  const pageSuffix = query.page > 1 ? ` - صفحة ${query.page}` : '';
  const categorySuffix = query.category ? ` في مسار ${query.category}` : '';
  const searchSuffix = query.search ? ` - نتائج البحث عن: ${query.search}` : '';

  const title = `${LISTING_TITLE}${categorySuffix}${searchSuffix}${pageSuffix}`;
  const description = query.category
    ? `تصفح أفضل المسارات التعليمية لتعلم ${query.category} في إثرالكود. خريطة طريق متكاملة من الصفر حتى الاحتراف.`
    : LISTING_DESCRIPTION;

  const indexable = shouldIndexListing({
    page: query.page,
    search: query.search,
    filters: {
      category: query.category,
      sort: query.sort !== 'newest' ? query.sort : undefined,
    },
  });

  return createPageMetadata({
    title,
    description,
    path: APP_ROUTES.LEARNING_PATHS,
    robots: indexable ? { index: true, follow: true } : NOINDEX_FOLLOW,
  });
}
