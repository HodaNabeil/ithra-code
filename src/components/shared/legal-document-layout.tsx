import type { ReactNode } from 'react';

type LegalDocumentLayoutProps = {
  children: ReactNode;
};

export function LegalDocumentLayout({ children }: LegalDocumentLayoutProps) {
  return (
    <div className="py-12 md:py-16">
      <div className="container max-w-4xl">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </article>
      </div>
    </div>
  );
}
