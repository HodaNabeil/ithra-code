import type { Metadata } from 'next';

import { SiteChrome } from '@/components/shared/layouts/site-chrome';
import { createNoIndexMetadata } from '@/lib/seo/create-page-metadata';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'لوحة المدرب',
  path: '/instructor',
});

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
