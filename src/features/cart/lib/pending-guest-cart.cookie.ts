import { cookies } from 'next/headers';
import { courseIdsSchema } from '@/validation/cart';

export const PENDING_GUEST_CART_COOKIE = 'pending_guest_cart';

const COOKIE_MAX_AGE_SECONDS = 15 * 60;

export async function setPendingGuestCartCookie(
  courseIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(courseIds)];
  if (uniqueIds.length === 0) return;

  const cookieStore = await cookies();
  cookieStore.set(PENDING_GUEST_CART_COOKIE, JSON.stringify(uniqueIds), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function readAndClearPendingGuestCartCookie(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PENDING_GUEST_CART_COOKIE)?.value;

  cookieStore.delete(PENDING_GUEST_CART_COOKIE);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const ids = parsed.filter((id): id is string => typeof id === 'string');
    if (ids.length === 0) return [];

    const validated = courseIdsSchema.safeParse(ids);
    return validated.success ? validated.data : [];
  } catch {
    return [];
  }
}
