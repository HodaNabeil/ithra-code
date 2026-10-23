'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

const isDev = process.env.NODE_ENV === 'development';

// Root-level boundary: replaces the root layout, so it must render <html> and
// <body>. Errors in nested routes (no route-level error.tsx exists) bubble up
// here; server-side errors are captured via `onRequestError` in
// instrumentation.ts. Sentry's Dedupe integration drops repeats of the same
// error captured by global handlers.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          textAlign: 'center',
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 24 }}>حدث خطأ غير متوقع</h1>
        <p>نعتذر عن ذلك. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          إعادة التحميل
        </button>
        {isDev && (
          <pre style={{ direction: 'ltr', textAlign: 'left', maxWidth: 800 }}>
            {error.message}
            {error.digest ? `\ndigest: ${error.digest}` : ''}
          </pre>
        )}
      </body>
    </html>
  );
}
