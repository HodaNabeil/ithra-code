import { APP_ROUTES } from '@/constants/enums';
import { toMetaDescription } from '@/lib/seo/description';
import { buildJsonLdGraph } from '@/lib/seo/json-ld/types';
import { getSiteOrigin, toCanonicalUrl } from '@/lib/seo/urls';
import { buildWebPageSchema } from '@/lib/seo/json-ld/builders/webpage';
import { getDefaultOrganizationSchema } from '@/lib/seo/json-ld/defaults';

const CONTACT_TITLE = 'تواصل معنا';
const CONTACT_DESCRIPTION =
  'تواصل مع فريق إثرالكود للاقتراحات، الدورات، والنصائح المهنية.';

export function buildContactPageJsonLd() {
  const origin = getSiteOrigin();
  const url = toCanonicalUrl(APP_ROUTES.CONTACT);

  return buildJsonLdGraph([
    getDefaultOrganizationSchema(origin),
    buildWebPageSchema({
      origin,
      path: APP_ROUTES.CONTACT,
      name: CONTACT_TITLE,
      description: toMetaDescription(CONTACT_DESCRIPTION),
      url,
    }),
  ]);
}
