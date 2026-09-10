import type { Metadata } from 'next';

import { SiteChrome } from '@/components/shared/layouts/site-chrome';
import { APP_ROUTES } from '@/constants/enums';
import { createNoIndexMetadata } from '@/lib/seo/create-page-metadata';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'الدفع',
  path: APP_ROUTES.CHECKOUT,
});

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
