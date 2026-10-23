import { connection } from 'next/server';

import { isSentryTestEnabled } from '@/lib/sentry/sentry-test-gate';

// Node.js runtime test: GET /api/debug/sentry-test
// Enabled only when SENTRY_TEST_ENDPOINT_ENABLED=true and the Sentry
// environment is not production.
export async function GET() {
  await connection();
  if (!isSentryTestEnabled()) {
    return new Response('Not Found', { status: 404 });
  }
  throw new Error(`Sentry test error (node) ${new Date().toISOString()}`);
}
