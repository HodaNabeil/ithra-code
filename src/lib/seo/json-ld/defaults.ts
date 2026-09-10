import { SEO_LOGO_PATH, SEO_SAME_AS, SEO_SITE_NAME_AR } from '../config';
import { getSiteOrigin } from '../urls';
import { buildOrganizationSchema } from './builders/organization';
import {
  buildCourseSearchUrlTemplate,
  buildWebsiteSchema,
} from './builders/website';

export function getDefaultOrganizationSchema(origin = getSiteOrigin()) {
  return buildOrganizationSchema({
    origin,
    name: SEO_SITE_NAME_AR,
    logoPath: SEO_LOGO_PATH,
    sameAs: SEO_SAME_AS,
  });
}

export function getDefaultWebsiteSchema(origin = getSiteOrigin()) {
  return buildWebsiteSchema({
    origin,
    name: SEO_SITE_NAME_AR,
    searchUrlTemplate: buildCourseSearchUrlTemplate(origin),
  });
}
