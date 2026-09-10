import type { Metadata } from 'next';

import { SiteChrome } from '@/components/shared/layouts/site-chrome';
import { APP_ROUTES } from '@/constants/enums';
import { createNoIndexMetadata } from '@/lib/seo/create-page-metadata';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'لوحة التحكم',
  path: APP_ROUTES.ADMIN,
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome showFooter={false}>{children}</SiteChrome>;
}
