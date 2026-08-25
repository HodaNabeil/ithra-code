'use client';

import { usePathname } from 'next/navigation';

/**
 * Wraps the Header and hides it on course learning pages
 * where the CourseLearningHeader is used instead.
 */
export function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide the main header on course learning pages (my-courses/[slug]/...)
  const isCourseLearnPage = /^\/my-courses\/[^/]+\//.test(pathname);
  const isApiDocsPage =
    pathname === '/docs' || pathname.startsWith('/api/docs');

  if (isCourseLearnPage || isApiDocsPage) return null;

  return <>{children}</>;
}
