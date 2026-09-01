/**
 * Cloudflare Turnstile dummy keys for local development.
 * Work on any domain including localhost.
 *
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const TURNSTILE_TEST_SECRET_KEY =
  '1x0000000000000000000000000000000AA';

function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

function shouldUseProductionTurnstileKeys(): boolean {
  return process.env.TURNSTILE_USE_PRODUCTION_KEYS === 'true';
}

export function isTurnstileEnabled(): boolean {
  return Boolean(resolveTurnstileSiteKey());
}

/**
 * Site key for the Turnstile widget. In development, production keys are
 * replaced with Cloudflare test keys to avoid error 110200 (domain not
 * authorized) on localhost.
 */
export function resolveTurnstileSiteKey(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!configured) {
    return undefined;
  }

  if (isDevelopment() && !shouldUseProductionTurnstileKeys()) {
    return TURNSTILE_TEST_SITE_KEY;
  }

  return configured;
}

/**
 * Secret key for server-side verification. Mirrors the site key resolution so
 * client and server stay in sync during local development.
 */
export function resolveTurnstileSecretKey(): string | undefined {
  const siteConfigured = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const secretConfigured = process.env.TURNSTILE_SECRET_KEY;

  if (!siteConfigured && !secretConfigured) {
    return undefined;
  }

  if (isDevelopment() && !shouldUseProductionTurnstileKeys()) {
    return siteConfigured ? TURNSTILE_TEST_SECRET_KEY : secretConfigured;
  }

  return secretConfigured;
}

export function isTurnstileVerificationRequired(): boolean {
  return Boolean(resolveTurnstileSecretKey());
}
