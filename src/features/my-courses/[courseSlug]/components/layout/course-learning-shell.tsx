'use client';

import React, { useLayoutEffect } from 'react';

import { CourseMainContent } from '@/features/my-courses/[courseSlug]/components/layout/course-main-content';
import { CourseSidebar } from '@/features/my-courses/[courseSlug]/components/layout/sidebar/course-sidebar';
import { cn } from '@/lib/utils';
import { useCourseLayoutStore } from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';

interface CourseLearningShellProps {
  courseSlug: string;
  isAiTutorEnabled?: boolean;
  children: React.ReactNode;
}

export const CourseLearningShell: React.FC<CourseLearningShellProps> = ({
  courseSlug,
  isAiTutorEnabled = false,
  children,
}) => {
  const initializeForCourse = useCourseLayoutStore((s) => s.initializeForCourse);

  useLayoutEffect(() => {
    initializeForCourse(courseSlug);
  }, [courseSlug, initializeForCourse]);

  return (
    <div className={cn('flex overflow-hidden relative  h-[90vh]')}>
      <CourseMainContent>{children}</CourseMainContent>
      <CourseSidebar isAiTutorEnabled={isAiTutorEnabled} />
    </div>
  );
};
