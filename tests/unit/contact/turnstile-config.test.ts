import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  TURNSTILE_TEST_SECRET_KEY,
  TURNSTILE_TEST_SITE_KEY,
  isTurnstileEnabled,
  isTurnstileVerificationRequired,
  resolveTurnstileSecretKey,
  resolveTurnstileSiteKey,
} from '@/features/contact/lib/turnstile-config';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllEnvs();
});

describe('turnstile-config', () => {
  it('returns undefined when site key is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
    vi.stubEnv('NODE_ENV', 'production');

    expect(resolveTurnstileSiteKey()).toBeUndefined();
    expect(isTurnstileEnabled()).toBe(false);
  });

  it('uses production keys in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'prod-site-key');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'prod-secret-key');

    expect(resolveTurnstileSiteKey()).toBe('prod-site-key');
    expect(resolveTurnstileSecretKey()).toBe('prod-secret-key');
    expect(isTurnstileVerificationRequired()).toBe(true);
  });

  it('uses Cloudflare test keys in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'prod-site-key');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'prod-secret-key');

    expect(resolveTurnstileSiteKey()).toBe(TURNSTILE_TEST_SITE_KEY);
    expect(resolveTurnstileSecretKey()).toBe(TURNSTILE_TEST_SECRET_KEY);
    expect(isTurnstileEnabled()).toBe(true);
    expect(isTurnstileVerificationRequired()).toBe(true);
  });

  it('allows production keys in development when explicitly requested', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'prod-site-key');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'prod-secret-key');
    vi.stubEnv('TURNSTILE_USE_PRODUCTION_KEYS', 'true');

    expect(resolveTurnstileSiteKey()).toBe('prod-site-key');
    expect(resolveTurnstileSecretKey()).toBe('prod-secret-key');
  });
});
