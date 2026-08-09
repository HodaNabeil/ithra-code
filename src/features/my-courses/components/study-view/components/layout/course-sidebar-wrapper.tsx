'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  getAsideWidthClass,
  getSidebarInnerWidthClass,
  useCourseLearningLayoutStore,
} from '@/features/my-courses/stores/use-course-learning-layout-store';

import { CourseSidebarContent } from './course-sidebar-content';

interface CourseSidebarWrapperProps {
  courseSlug: string;
  aiTutorEnabled?: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleMaximized: () => void;
}

export const CourseSidebarWrapper: React.FC<CourseSidebarWrapperProps> = ({
  courseSlug,
  aiTutorEnabled = false,
  setSidebarOpen,
  toggleMaximized,
}) => {
  const isSidebarOpen = useCourseLearningLayoutStore((s) => s.isSidebarOpen);
  const isMaximized = useCourseLearningLayoutStore((s) => s.isMaximized);

  return (
    <aside
      className={cn(
        'h-full overflow-hidden transition-all duration-300 ease-in-out border-r border-border/40 bg-sidebar',
        getAsideWidthClass(isSidebarOpen, isMaximized),
      )}
    >
      <div
        className={cn(
          'h-full transition-all duration-300',
          getSidebarInnerWidthClass(isMaximized),
        )}
      >
        <CourseSidebarContent
          courseSlug={courseSlug}
          aiTutorEnabled={aiTutorEnabled}
          onClose={() => setSidebarOpen(false)}
          onMaximize={() => toggleMaximized()}
          isMaximized={isMaximized}
        />
      </div>
    </aside>
  );
};
