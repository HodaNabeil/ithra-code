import { APP_ROUTES } from '@/constants/enums';
import type { PathDetailDTO } from '@/types/path/path.dto';
import { toMetaDescription } from '@/lib/seo/description';
import { buildJsonLdGraph } from '@/lib/seo/json-ld/types';
import {
  getSiteOrigin,
  toAbsoluteAssetUrl,
  toCanonicalUrl,
} from '@/lib/seo/urls';
import { buildCreativeWorkSchema } from '@/lib/seo/json-ld/builders/creative-work';
import { buildWebPageSchema } from '@/lib/seo/json-ld/builders/webpage';
import { getDefaultOrganizationSchema } from '@/lib/seo/json-ld/defaults';

export function buildLearningPathPageJsonLd(path: PathDetailDTO) {
  const origin = getSiteOrigin();
  const pagePath = `${APP_ROUTES.LEARNING_PATHS}/${path.slug}`;
  const url = toCanonicalUrl(pagePath);
  const description = toMetaDescription(
    path.metaDescription || path.summary || path.tagline,
  );
  const name = path.metaTitle || path.title;

  return buildJsonLdGraph([
    getDefaultOrganizationSchema(origin),
    buildWebPageSchema({
      origin,
      path: pagePath,
      name,
      description,
      url,
    }),
    buildCreativeWorkSchema({
      origin,
      name: path.title,
      description,
      url,
      imageUrl: path.thumbnailUrl
        ? toAbsoluteAssetUrl(path.thumbnailUrl)
        : undefined,
      hasPart: path.tracks?.map((track) => ({
        name: track.title,
        description: toMetaDescription(track.summary) || undefined,
      })),
    }),
  ]);
}
