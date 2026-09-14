'use client';

import type { ReactNode } from 'react';
import { LectureContentTabs } from './lecture-content-tabs';

interface LectureWorkspaceProps {
  children: ReactNode;
}

/** Video stage on top, lecture tabs in a separate section below. */
export function LectureWorkspace({ children }: LectureWorkspaceProps) {
  return (
    <div className="flex flex-col">
      <section aria-label="مشغل الفيديو" className="bg-black">
        {children}
      </section>
      <section
        aria-label="تبويبات المحاضرة"
        className="border-t border-border bg-background"
      >
        <LectureContentTabs />
      </section>
    </div>
  );
}
