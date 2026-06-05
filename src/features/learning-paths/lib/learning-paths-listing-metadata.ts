import type { Metadata } from 'next';
import type { LearningPathsPageQuery } from './learning-paths-page-query';

const SITE_ORIGIN = 'https://ithracode.com';

export function buildLearningPathsListingMetadata(
  query: LearningPathsPageQuery,
): Metadata {
  const pageSuffix = query.page > 1 ? ` - صفحة ${query.page}` : '';
  const categorySuffix = query.category ? ` في مسار ${query.category}` : '';
  const searchSuffix = query.search ? ` - نتائج البحث عن: ${query.search}` : '';

  const title = `المسارات التعليمية${categorySuffix}${searchSuffix}${pageSuffix} | منصة إثرالكود`;
  const description = query.category
    ? `تصفح أفضل المسارات التعليمية لتعلم ${query.category} في إثرالكود. خريطة طريق متكاملة من الصفر حتى الاحتراف.`
    : 'اكتشف المسارات التعليمية المصممة بعناية لتمكينك من إتقان البرمجة وتطوير البرمجيات. ابدأ رحلتك الآن مع إثرالكود.';

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_ORIGIN}/learning-paths`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_ORIGIN}/learning-paths${query.category ? `/${query.category}` : ''}`,
    },
  };
}
