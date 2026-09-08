import type { ReactNode } from 'react';

import { SiteChrome } from '@/components/shared/layouts/site-chrome';

export default function StudentDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
