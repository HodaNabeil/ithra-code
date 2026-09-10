import { APP_ROUTES } from '@/constants/enums';
import type { PathListDTO } from '@/types/path/path.dto';
import { toMetaDescription } from '@/lib/seo/description';
import { buildJsonLdGraph } from '@/lib/seo/json-ld/types';
import { getSiteOrigin, toCanonicalUrl } from '@/lib/seo/urls';
import { buildItemListSchema } from '@/lib/seo/json-ld/builders/item-list';
import { buildWebPageSchema } from '@/lib/seo/json-ld/builders/webpage';
import { getDefaultOrganizationSchema } from '@/lib/seo/json-ld/defaults';

const LISTING_TITLE = 'المسارات التعليمية';
const LISTING_DESCRIPTION =
  'اكتشف المسارات التعليمية المصممة بعناية لتمكينك من إتقان البرمجة وتطوير البرمجيات. ابدأ رحلتك الآن مع إثرالكود.';

export function buildLearningPathsListingJsonLd(paths: PathListDTO[]) {
  const origin = getSiteOrigin();
  const url = toCanonicalUrl(APP_ROUTES.LEARNING_PATHS);
  const description = toMetaDescription(LISTING_DESCRIPTION);

  return buildJsonLdGraph([
    getDefaultOrganizationSchema(origin),
    buildWebPageSchema({
      origin,
      path: APP_ROUTES.LEARNING_PATHS,
      name: LISTING_TITLE,
      description,
      url,
    }),
    paths.length > 0
      ? buildItemListSchema({
          origin,
          items: paths.map((path) => ({
            type: 'CreativeWork',
            url: toCanonicalUrl(`${APP_ROUTES.LEARNING_PATHS}/${path.slug}`),
            name: path.title,
            description: toMetaDescription(path.summary || path.tagline),
          })),
        })
      : null,
  ]);
}
