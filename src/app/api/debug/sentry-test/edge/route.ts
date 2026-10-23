import { isSentryTestEnabled } from '@/lib/sentry/sentry-test-gate';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Edge runtime test: GET /api/debug/sentry-test/edge
export async function GET() {
  if (!isSentryTestEnabled()) {
    return new Response('Not Found', { status: 404 });
  }
  throw new Error(`Sentry test error (edge) ${new Date().toISOString()}`);
}
