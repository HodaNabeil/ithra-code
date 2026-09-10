import type { Metadata } from 'next';

import { createNoIndexMetadata } from '@/lib/seo/create-page-metadata';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'API Docs',
  path: '/docs',
});

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div dir="ltr" lang="en" className="api-docs-ltr min-h-screen bg-white">
      {children}
    </div>
  );
}
