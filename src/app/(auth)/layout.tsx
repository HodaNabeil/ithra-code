import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { createNoIndexMetadata } from '@/lib/seo/create-page-metadata';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'تسجيل الدخول',
  path: '/auth/signin',
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
