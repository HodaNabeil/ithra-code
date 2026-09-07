import React from 'react';
import { redirect } from 'next/navigation';

import { requireAuth } from '@/features/my-courses/lib/require-auth';
import { APP_ROUTES } from '@/constants/enums';
import { getCourseSections } from '@/features/my-courses/actions/my-course';
import { CourseLearningShell } from '@/features/my-courses/[courseSlug]/components/layout/course-learning-shell';
import { LectureHeader } from '@/features/my-courses/[courseSlug]/components/layout/header';
import { AITutorConfig } from '@/features/ai-tutor';

export default async function MyCourseLayout({
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
    <>
      <LectureHeader />
      <main className=" overflow-hidden">
        <CourseLearningShell
          courseSlug={courseSlug}
          isAiTutorEnabled={AITutorConfig.isEnabled()}
        >
          {children}
        </CourseLearningShell>
      </main>
    </>
  );
}
