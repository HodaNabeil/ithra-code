import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { APP_ROUTES } from '@/constants/enums';
import { createNoIndexMetadata } from '@/lib/seo/create-page-metadata';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'دوراتي',
  path: APP_ROUTES.MY_COURSES,
});

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex-1 bg-student-background">{children}</div>
  );
}
