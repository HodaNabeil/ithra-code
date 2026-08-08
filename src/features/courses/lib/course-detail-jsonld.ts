import type { CourseDetailDTO } from '@/types/course/course.dto';

export function buildCourseDetailJsonLd(course: CourseDetailDTO) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'إثرالكود',
      sameAs: 'https://ithracode.com',
    },
    offers: {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: course.currency || 'EGP',
      category: 'Paid',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: course.rating || 0,
      reviewCount: course.ratingCount,
    },
  };
}
