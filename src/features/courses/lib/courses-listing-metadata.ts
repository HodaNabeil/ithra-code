import type { Metadata } from 'next';

interface CoursesMetadataParams {
  page: number;
  search?: string;
  path?: string;
}

export function buildCoursesListingMetadata(
  params: CoursesMetadataParams,
): Metadata {
  const pageSuffix = params.page > 1 ? ` - صفحة ${params.page}` : '';
  const pathSuffix = params.path ? ` في مسار ${params.path}` : '';
  const searchSuffix = params.search
    ? ` - نتائج البحث عن: ${params.search}`
    : '';

  const title = `الدورات التدريبية${pathSuffix}${searchSuffix}${pageSuffix} | منصة إثرالكود`;
  const description = params.path
    ? `تصفح أفضل دورات ${params.path} في إثرالكود. تعلم من الصفر حتى الاحتراف مع تطبيق عملي.`
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
      url: `https://ithracode.com/courses${params.path ? `?path=${params.path}` : ''}`,
    },
  };
}
