import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { AUTH_ENDPOINTS } from '@/constants/auth';

/**
 * Server-side auth guard — validates session and redirects to login if absent.
 * Returns the authenticated user's ID on success.
 *
 * @param callbackUrl - The URL to redirect back to after login.
 */
export async function requireAuth(callbackUrl: string): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    const encoded = encodeURIComponent(callbackUrl);
    redirect(`${AUTH_ENDPOINTS.LOGIN}?callbackUrl=${encoded}`);
  }

  return session.user.id;
}
