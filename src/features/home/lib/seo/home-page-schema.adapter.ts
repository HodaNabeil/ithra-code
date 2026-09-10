import type { FaqItem } from '@/features/faqs';
import { APP_ROUTES } from '@/constants/enums';
import { SEO_DEFAULT_DESCRIPTION, SEO_DEFAULT_TITLE } from '@/lib/seo/config';
import { toMetaDescription } from '@/lib/seo/description';
import { buildJsonLdGraph } from '@/lib/seo/json-ld/types';
import { getSiteOrigin, toCanonicalUrl } from '@/lib/seo/urls';
import { buildFaqSchema } from '@/lib/seo/json-ld/builders/faq';
import { buildWebPageSchema } from '@/lib/seo/json-ld/builders/webpage';
import {
  getDefaultOrganizationSchema,
  getDefaultWebsiteSchema,
} from '@/lib/seo/json-ld/defaults';

export function buildHomePageJsonLd(faqs: FaqItem[]) {
  const origin = getSiteOrigin();
  const url = toCanonicalUrl(APP_ROUTES.ROOT);
  const description = toMetaDescription(SEO_DEFAULT_DESCRIPTION);

  return buildJsonLdGraph([
    getDefaultOrganizationSchema(origin),
    getDefaultWebsiteSchema(origin),
    buildWebPageSchema({
      origin,
      path: APP_ROUTES.ROOT,
      name: SEO_DEFAULT_TITLE,
      description,
      url,
    }),
    buildFaqSchema({
      items: faqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
    }),
  ]);
}
