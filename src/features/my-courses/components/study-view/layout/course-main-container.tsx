'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCourseLearningLayoutStore } from '@/features/my-courses/stores/use-course-learning-layout-store';

interface CourseMainContainerProps {
  children: React.ReactNode;
}

export const CourseMainContainer: React.FC<CourseMainContainerProps> = ({
  children,
}) => {
  const isSidebarOpen = useCourseLearningLayoutStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useCourseLearningLayoutStore((s) => s.setSidebarOpen);

  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto no-scrollbar relative bg-background transition-all duration-300 ease-in-out',
        !isSidebarOpen && 'w-full h-[88vh]',
      )}
    >
      {children}

      {/* Reopen Button - Floating on the left edge in RTL (sidebar side) */}
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={cn(
            'group absolute top-6 left-0 z-50 flex items-center bg-primary text-primary-foreground rounded-r-xl py-2.5 px-3 shadow-lg transition-all duration-300 ease-in-out hover:pl-5',
            'translate-x-0 flex-row-reverse',
          )}
        >
          <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-[14px] font-medium transition-all duration-300 group-hover:max-w-[200px] group-hover:ml-3">
            AI Assistant ومحتوى الدورة
          </span>
        </button>
      )}
    </main>
  );
};
