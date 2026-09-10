import { APP_ROUTES } from '@/constants/enums';
import type { CourseListDTO } from '@/types/course/course.dto';
import { toMetaDescription } from '@/lib/seo/description';
import { buildJsonLdGraph } from '@/lib/seo/json-ld/types';
import { getSiteOrigin, toCanonicalUrl } from '@/lib/seo/urls';
import { buildItemListSchema } from '@/lib/seo/json-ld/builders/item-list';
import { buildWebPageSchema } from '@/lib/seo/json-ld/builders/webpage';
import { getDefaultOrganizationSchema } from '@/lib/seo/json-ld/defaults';

const LISTING_TITLE = 'الدورات التدريبية';
const LISTING_DESCRIPTION =
  'اكتشف مجموعتنا الواسعة من الدورات التدريبية في البرمجة وتطوير الويب. تعلم من الخبراء وارتقِ بمسيرتك المهنية.';

export function buildCoursesListingJsonLd(courses: CourseListDTO[]) {
  const origin = getSiteOrigin();
  const url = toCanonicalUrl(APP_ROUTES.COURSES);
  const description = toMetaDescription(LISTING_DESCRIPTION);

  return buildJsonLdGraph([
    getDefaultOrganizationSchema(origin),
    buildWebPageSchema({
      origin,
      path: APP_ROUTES.COURSES,
      name: LISTING_TITLE,
      description,
      url,
    }),
    courses.length > 0
      ? buildItemListSchema({
          origin,
          items: courses.map((course) => ({
            type: 'Course',
            url: toCanonicalUrl(`${APP_ROUTES.COURSES}/${course.slug}`),
            name: course.title,
            description: toMetaDescription(course.description),
          })),
        })
      : null,
  ]);
}
