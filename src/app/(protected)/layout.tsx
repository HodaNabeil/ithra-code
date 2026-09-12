import type { ReactNode } from 'react';

import { SiteChrome } from '@/components/shared/layouts/site-chrome';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
