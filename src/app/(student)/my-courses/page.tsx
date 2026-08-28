import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

import CoursesDataWrapper from '@/features/my-courses/components/my-courses/CoursesDataWrapper';
import { AUTH_ENDPOINTS } from '@/constants/auth';
import { APP_ROUTES } from '@/constants/enums';

export default async function StudentCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string }>;
}) {
  const { page, tab } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect(`${AUTH_ENDPOINTS.LOGIN}?callbackUrl=${APP_ROUTES.MY_COURSES}`);
  }

  return (
    <CoursesDataWrapper
      userId={userId}
      page={Number(page) || 1}
      initialTab={tab}
    />
  );
}
