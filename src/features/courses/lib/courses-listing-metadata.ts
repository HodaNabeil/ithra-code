import type { Metadata } from 'next';
import type { CoursesPageQuery } from './courses-page-query';

export function buildCoursesListingMetadata(query: CoursesPageQuery): Metadata {
  const pageSuffix = query.page > 1 ? ` - صفحة ${query.page}` : '';
  const categorySuffix = query.category ? ` في قسم ${query.category}` : '';
  const searchSuffix = query.search ? ` - نتائج البحث عن: ${query.search}` : '';

  const title = `الدورات التدريبية${categorySuffix}${searchSuffix}${pageSuffix} | منصة إثرالكود`;
  const description = query.category
    ? `تصفح أفضل دورات ${query.category} في إثرالكود. تعلم من الصفر حتى الاحتراف مع تطبيق عملي.`
    : 'اكتشف مجموعتنا الواسعة من الدورات التدريبية في البرمجة وتطوير الويب. تعلم من الخبراء وارتقِ بمسيرتك المهنية.';

  return {
    title,
    description,
    alternates: {
      canonical: 'https://ithracode.com/courses',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://ithracode.com/courses${query.category ? `/${query.category}` : ''}`,
    },
  };
}
