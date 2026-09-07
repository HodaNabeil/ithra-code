'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  getSidebarContainerWidthClass,
  getSidebarContentWidthClass,
  useCourseLayoutStore,
} from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';
import { CourseSidebarTabs } from './tabs';

interface CourseSidebarProps {
  isAiTutorEnabled?: boolean;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  isAiTutorEnabled = false,
}) => {
  const isSidebarOpen = useCourseLayoutStore((s) => s.isSidebarOpen);
  const isSidebarExpanded = useCourseLayoutStore((s) => s.isSidebarExpanded);

  return (
    <aside
      dir="rtl"
      className={cn(
        'h-full overflow-hidden border-e border-border/40 bg-sidebar',
        getSidebarContainerWidthClass(isSidebarOpen, isSidebarExpanded),
      )}
    >
      <div
        className={cn(
          'h-full min-h-0 overflow-hidden',
          getSidebarContentWidthClass(isSidebarExpanded),
        )}
      >
        <CourseSidebarTabs isAiTutorEnabled={isAiTutorEnabled} />
      </div>
    </aside>
  );
};
