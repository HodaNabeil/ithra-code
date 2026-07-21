import { env } from '@/config';

export type PaymobConfig = {
  apiUrl: string;
  secretKey: string;
  publicKey: string;
  hmacSecret: string;
  integrationIds: number[];
};

/**
 * Returns the Paymob configuration when all required secrets are present,
 * otherwise `null`. The composition root uses this to decide whether to
 * register the real gateway or fall back to the fake one.
 */
export function readPaymobConfig(): PaymobConfig | null {
  const secretKey = env.PAYMOB_SECRET_KEY;
  const publicKey = env.PAYMOB_PUBLIC_KEY;
  const hmacSecret = env.PAYMOB_HMAC_SECRET;

  if (!secretKey || !publicKey || !hmacSecret) {
    return null;
  }

  const integrationIds = (env.PAYMOB_INTEGRATION_IDS ?? '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  return {
    apiUrl: env.PAYMOB_API_URL,
    secretKey,
    publicKey,
    hmacSecret,
    integrationIds,
  };
}

export function isPaymobConfigured(): boolean {
  return readPaymobConfig() !== null;
}
