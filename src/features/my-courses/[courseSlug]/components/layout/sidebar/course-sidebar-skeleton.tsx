'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionAccordionSkeleton } from '../../content/section-accordion-skeleton';

export const CourseSidebarSkeleton: React.FC = () => {
  return (
    <div
      className="flex flex-col h-full bg-sidebar border-l border-border/40"
      dir="rtl"
    >
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-2 pt-2 border-b border-border/40">
        <div className="h-12 flex items-center px-4 gap-4 bg-transparent w-full max-w-[280px]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="flex items-center gap-1.5 px-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </div>

      {/* Main Skeleton Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <SectionAccordionSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};
