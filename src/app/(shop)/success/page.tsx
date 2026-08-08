import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@/constants/enums';

/**
 * Legacy success route — forwards to /payment/success with query preserved.
 */
export default async function LegacySuccessRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      qs.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    }
  }

  const query = qs.toString();
  redirect(
    query
      ? `${APP_ROUTES.PAYMENT_SUCCESS}?${query}`
      : APP_ROUTES.PAYMENT_SUCCESS,
  );
}
