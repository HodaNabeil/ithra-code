'use client';

import React, { useEffect } from 'react';

import { CourseMainContainer } from './course-main-container';
import { CourseSidebarWrapper } from './course-sidebar-wrapper';
import { cn } from '@/lib/utils';
import { useCourseLearningLayoutStore } from '@/features/my-courses/stores/use-course-learning-layout-store';

interface CourseContentLayoutBodyProps {
  courseSlug: string;
  children: React.ReactNode;
}

export const CourseContentLayoutBody: React.FC<
  CourseContentLayoutBodyProps
> = ({ courseSlug, children }) => {
  const ensureCourse = useCourseLearningLayoutStore((s) => s.ensureCourse);
  const setSidebarOpen = useCourseLearningLayoutStore((s) => s.setSidebarOpen);
  const toggleMaximized = useCourseLearningLayoutStore(
    (s) => s.toggleMaximized,
  );

  useEffect(() => {
    ensureCourse(courseSlug);
  }, [courseSlug, ensureCourse]);

  return (
    <div
      className={cn(
        'flex overflow-hidden relative transition-all duration-300 ease-in-out h-[90vh]',
      )}
      dir="rtl"
    >
      {/* Main Content Area */}
      <CourseMainContainer>{children}</CourseMainContainer>

      {/* Sidebar Area */}
      <CourseSidebarWrapper
        courseSlug={courseSlug}
        setSidebarOpen={setSidebarOpen}
        toggleMaximized={toggleMaximized}
      />
    </div>
  );
};
