import { notFound } from 'next/navigation';

import { isSentryTestEnabled } from '@/lib/sentry/sentry-test-gate';

import { SentryTestButtons } from './sentry-test-buttons';

export const dynamic = 'force-dynamic';

// Browser test page: /debug/sentry-test (404 unless explicitly enabled).
export default function SentryTestPage() {
  if (!isSentryTestEnabled()) notFound();
  return <SentryTestButtons />;
}
