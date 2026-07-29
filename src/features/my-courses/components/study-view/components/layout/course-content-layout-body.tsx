'use client';

import React, { useEffect } from 'react';

import { CourseMainContainer } from './course-main-container';
import { CourseSidebarWrapper } from './course-sidebar-wrapper';
import { cn } from '@/lib/utils';
import { useCourseLearningLayoutStore } from '@/features/my-courses/stores/use-course-learning-layout-store';

interface CourseContentLayoutBodyProps {
  courseSlug: string;
  aiTutorEnabled?: boolean;
  children: React.ReactNode;
}

export const CourseContentLayoutBody: React.FC<
  CourseContentLayoutBodyProps
> = ({ courseSlug, aiTutorEnabled = false, children }) => {
  const ensureCourse = useCourseLearningLayoutStore((s) => s.ensureCourse);
  const setAiTutorEnabled = useCourseLearningLayoutStore(
    (s) => s.setAiTutorEnabled,
  );
  const setSidebarOpen = useCourseLearningLayoutStore((s) => s.setSidebarOpen);
  const toggleMaximized = useCourseLearningLayoutStore(
    (s) => s.toggleMaximized,
  );

  useEffect(() => {
    ensureCourse(courseSlug);
  }, [courseSlug, ensureCourse]);

  useEffect(() => {
    setAiTutorEnabled(aiTutorEnabled);
  }, [aiTutorEnabled, setAiTutorEnabled]);

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
