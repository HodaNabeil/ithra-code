'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  getAsideWidthClass,
  getSidebarInnerWidthClass,
  useCourseLayoutStore,
} from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';
import { CourseSidebarTabs } from '@/features/my-courses/[courseSlug]/components/layout/sidebar/course-sidebar-tabs';

interface CourseSidebarProps {
  isAiTutorEnabled?: boolean;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  isAiTutorEnabled = false,
}) => {
  const isSidebarOpen = useCourseLayoutStore((s) => s.isSidebarOpen);
  const isMaximized = useCourseLayoutStore((s) => s.isMaximized);

  return (
    <aside
      className={cn(
        'h-full overflow-hidden border-r border-border/40 bg-sidebar',
        getAsideWidthClass(isSidebarOpen, isMaximized),
      )}
    >
      <div className={cn('h-full ', getSidebarInnerWidthClass(isMaximized))}>
        <CourseSidebarTabs isAiTutorEnabled={isAiTutorEnabled} />
      </div>
    </aside>
  );
};
