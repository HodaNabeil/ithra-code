import React from 'react';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { FullPageSkeleton } from '@/features/my-courses/components/CoursesListSkeleton';

import CoursesDataWrapper from '@/features/my-courses/components/my-courses/CoursesDataWrapper';
import { AUTH_ENDPOINTS } from '@/constant/auth';
import { APP_ROUTES } from '@/constant/enums';

export default async function StudentCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect(`${AUTH_ENDPOINTS.LOGIN}?callbackUrl=${APP_ROUTES.MY_COURSES}`);
  }
  return (
    <Suspense fallback={<FullPageSkeleton />}>
      <CoursesDataWrapper userId={userId} page={Number(page) || 1} />
    </Suspense>
  );
}
