/**
 * Sentry test endpoints are opt-in and can never run in production, even if
 * the flag is accidentally set there.
 */
export function isSentryTestEnabled(): boolean {
  const environment =
    process.env.SENTRY_ENVIRONMENT ??
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT;
  if (environment === 'production') return false;
  if (!environment && process.env.NODE_ENV === 'production') return false;
  return process.env.SENTRY_TEST_ENDPOINT_ENABLED === 'true';
}
