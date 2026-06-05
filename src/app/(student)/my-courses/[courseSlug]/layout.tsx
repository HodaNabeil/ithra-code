import React from 'react';
import { redirect } from 'next/navigation';

import { requireAuth } from '@/features/my-courses/lib/require-auth';
import { APP_ROUTES } from '@/constant/enums';
import { getCourseSections } from '@/features/my-courses/actions/my-course';
import { CourseContentLayoutBody } from '@/features/my-courses/components/study-view/components/layout/course-content-layout-body';
import { CourseLearningHeader } from '@/features/my-courses/components/study-view/components/layout/course-learning-header';

export default async function CourseLearningLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  await requireAuth(`${APP_ROUTES.COURSES}/${courseSlug}`);

  const data = await getCourseSections(courseSlug);

  if (!data) {
    redirect(`${APP_ROUTES.COURSES}/${courseSlug}?notEnrolled=1`);
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" dir="rtl">
      <CourseLearningHeader
        courseTitle={'mastering-react-hooks'}
        completedCount={10}
        totalCount={20}
      />
      <div className="flex-1 overflow-hidden">
        <CourseContentLayoutBody courseSlug={courseSlug}>
          {children}
        </CourseContentLayoutBody>
      </div>
    </div>
  );
}
