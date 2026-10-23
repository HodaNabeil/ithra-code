/**
 * Shared Sentry option resolution for the browser, Node.js and Edge runtimes.
 *
 * Must stay edge-safe (no Node-only APIs). `NEXT_PUBLIC_*` values are inlined
 * at build time, so they must be referenced with literal `process.env.X`
 * accesses (no dynamic lookups).
 */

export type SentryEnvironment = 'development' | 'staging' | 'production';

/**
 * Resolved from `SENTRY_ENVIRONMENT` (server/edge) or the build-time copy
 * `NEXT_PUBLIC_SENTRY_ENVIRONMENT` (injected by next.config.ts, so the browser
 * always agrees with the server). Falls back to NODE_ENV only as a last resort.
 */
export function resolveSentryEnvironment(): {
  environment: string;
  isFallback: boolean;
} {
  const explicit =
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim();

  if (explicit) {
    return { environment: explicit, isFallback: false };
  }

  return {
    environment:
      process.env.NODE_ENV === 'production' ? 'production' : 'development',
    isFallback: true,
  };
}

const TRACES_SAMPLE_RATE: Record<SentryEnvironment, number> = {
  development: 1.0,
  staging: 1.0,
  production: 0.1,
};

const REPLAY_SESSION_SAMPLE_RATE: Record<SentryEnvironment, number> = {
  development: 0,
  staging: 0.1,
  production: 0.01,
};

function rateFor<T extends Record<SentryEnvironment, number>>(
  table: T,
  environment: string,
  fallback: number,
): number {
  return table[environment as SentryEnvironment] ?? fallback;
}

export function getTracesSampleRate(environment: string): number {
  // Unknown custom environments (e.g. "qa") are treated like production.
  return rateFor(TRACES_SAMPLE_RATE, environment, 0.1);
}

export function getReplaySessionSampleRate(environment: string): number {
  return rateFor(REPLAY_SESSION_SAMPLE_RATE, environment, 0.01);
}

/** Replays are always kept when an error occurs. */
export const REPLAY_ON_ERROR_SAMPLE_RATE = 1.0;

/**
 * Privacy defaults shared by every runtime. Nothing user-identifying, request
 * bodies, or AI payloads are collected.
 */
export const SENTRY_DATA_COLLECTION = {
  userInfo: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  httpBodies: [],
  httpHeaders: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  cookies: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
};

/**
 * Builds the options common to all runtimes and logs a one-line diagnostic
 * (never the DSN itself). A missing DSN is reported loudly instead of being
 * silently ignored.
 */
export function getBaseSentryOptions(runtime: 'client' | 'server' | 'edge') {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
  const { environment, isFallback } = resolveSentryEnvironment();
  const tracesSampleRate = getTracesSampleRate(environment);

  if (!dsn) {
    console.error(
      `[sentry:${runtime}] NEXT_PUBLIC_SENTRY_DSN is not set - error reporting is DISABLED. ` +
        'It must be present at build time (it is inlined into the browser bundle).',
    );
  } else if (isFallback && process.env.NODE_ENV === 'production') {
    console.warn(
      `[sentry:${runtime}] SENTRY_ENVIRONMENT is not set; falling back to "${environment}". ` +
        'Set it explicitly (staging/production) so events are not mislabelled.',
    );
  }

  return {
    dsn,
    environment,
    tracesSampleRate,
    dataCollection: SENTRY_DATA_COLLECTION,
    // Opt in for local debugging only: SENTRY_DEBUG=true
    debug: process.env.SENTRY_DEBUG === 'true',
  };
}
