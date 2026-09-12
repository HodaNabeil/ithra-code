import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ComingSoon } from '@/components/shared/coming-soon';
import { AUTH_ENDPOINTS } from '@/constants/auth';
import { PROFILE_ROUTES } from '@/constants/routes';
import { auth } from '@/lib/auth';
import { createNoIndexMetadata } from '@/lib/seo/create-page-metadata';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'الملف الشخصي',
  path: PROFILE_ROUTES.GENERAL,
});

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`${AUTH_ENDPOINTS.LOGIN}?callbackUrl=${PROFILE_ROUTES.GENERAL}`);
  }

  return <ComingSoon title="الملف الشخصي" />;
}
