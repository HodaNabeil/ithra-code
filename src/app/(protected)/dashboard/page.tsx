import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ComingSoon } from '@/components/shared/coming-soon';
import { AUTH_ENDPOINTS } from '@/constants/auth';
import { PROTECTED_ROUTES } from '@/constants/routes';
import { auth } from '@/lib/auth';
import { createNoIndexMetadata } from '@/lib/seo/create-page-metadata';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'لوحة التحكم',
  path: PROTECTED_ROUTES.DASHBOARD,
});

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`${AUTH_ENDPOINTS.LOGIN}?callbackUrl=${PROTECTED_ROUTES.DASHBOARD}`);
  }

  return <ComingSoon title="لوحة التحكم" />;
}
