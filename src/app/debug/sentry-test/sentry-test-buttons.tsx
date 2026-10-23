'use client';

export function SentryTestButtons() {
  return (
    <main style={{ padding: 24 }} dir="ltr">
      <h1>Sentry test</h1>
      <button
        type="button"
        onClick={() => {
          throw new Error(
            `Sentry test error (browser) ${new Date().toISOString()}`,
          );
        }}
      >
        Throw browser error
      </button>
    </main>
  );
}
