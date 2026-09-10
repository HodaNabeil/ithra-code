import type { CourseDetailApiDTO } from '@/features/courses/course-detail';
import { APP_ROUTES } from '@/constants/enums';
import { DEFAULT_CURRENCY } from '@/constants/currency';
import { toMetaDescription } from '@/lib/seo/description';
import { buildJsonLdGraph } from '@/lib/seo/json-ld/types';
import {
  getSiteOrigin,
  toAbsoluteAssetUrl,
  toCanonicalUrl,
} from '@/lib/seo/urls';
import { buildBreadcrumbSchema } from '@/lib/seo/json-ld/builders/breadcrumb';
import { buildCourseSchema } from '@/lib/seo/json-ld/builders/course';
import { buildWebPageSchema } from '@/lib/seo/json-ld/builders/webpage';
import { getDefaultOrganizationSchema } from '@/lib/seo/json-ld/defaults';

export function buildCoursePageJsonLd(course: CourseDetailApiDTO) {
  const origin = getSiteOrigin();
  const path = `${APP_ROUTES.COURSES}/${course.slug}`;
  const url = toCanonicalUrl(path);
  const listingUrl = toCanonicalUrl(APP_ROUTES.COURSES);
  const description = toMetaDescription(
    course.metaDescription ?? course.shortDescription ?? course.description,
  );
  const name = course.metaTitle ?? course.title;

  return buildJsonLdGraph([
    getDefaultOrganizationSchema(origin),
    buildWebPageSchema({
      origin,
      path,
      name,
      description,
      url,
    }),
    buildBreadcrumbSchema([
      { name: 'الدورات', url: listingUrl },
      { name: course.title, url },
    ]),
    buildCourseSchema({
      origin,
      name: course.title,
      description,
      url,
      imageUrl: course.thumbnailUrl
        ? toAbsoluteAssetUrl(course.thumbnailUrl)
        : undefined,
      price: course.price,
      currency: course.currency || DEFAULT_CURRENCY,
      rating: course.rating,
      ratingCount: course.ratingCount,
    }),
  ]);
}
