import type { Session } from 'next-auth';
import { unstable_rethrow } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * Session for UI/RSC. Auth.js can return an error payload (no `user.id`)
 * when `/api/auth/session` is misconfigured; treat that as logged out.
 */
export async function getAuthSession(): Promise<Session | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return session;
  } catch (error) {
    unstable_rethrow(error);
    console.error('[AUTH_SESSION]', error);
    return null;
  }
}
