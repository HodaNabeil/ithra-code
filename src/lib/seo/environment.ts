import { env } from '@/config/env';

import { getSiteOrigin } from './urls';

export function isNonIndexableHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  return hostname.endsWith('.vercel.app');
}

export function isSeoIndexingEnabled(options?: {
  nodeEnv?: string;
  origin?: string;
}): boolean {
  const nodeEnv = options?.nodeEnv ?? env.NODE_ENV;
  if (nodeEnv !== 'production') {
    return false;
  }

  try {
    const origin = options?.origin ?? getSiteOrigin();
    const hostname = new URL(origin).hostname;
    return !isNonIndexableHost(hostname);
  } catch {
    return false;
  }
}
