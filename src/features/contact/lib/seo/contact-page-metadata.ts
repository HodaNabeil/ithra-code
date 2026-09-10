import type { Metadata } from 'next';

import { APP_ROUTES } from '@/constants/enums';
import { createPageMetadata } from '@/lib/seo/create-page-metadata';

const CONTACT_TITLE = 'تواصل معنا';
const CONTACT_DESCRIPTION =
  'تواصل مع فريق إثرالكود للاقتراحات، الدورات، والنصائح المهنية.';

export function buildContactPageMetadata(): Metadata {
  return createPageMetadata({
    title: CONTACT_TITLE,
    description: CONTACT_DESCRIPTION,
    path: APP_ROUTES.CONTACT,
  });
}
