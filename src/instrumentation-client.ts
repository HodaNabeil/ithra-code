import * as Sentry from '@sentry/nextjs';

import {
  getBaseSentryOptions,
  getReplaySessionSampleRate,
  REPLAY_ON_ERROR_SAMPLE_RATE,
} from '@/lib/sentry/sentry-config';

const baseOptions = getBaseSentryOptions('client');

Sentry.init({
  ...baseOptions,
  replaysSessionSampleRate: getReplaySessionSampleRate(baseOptions.environment),
  replaysOnErrorSampleRate: REPLAY_ON_ERROR_SAMPLE_RATE,
  integrations: [
    Sentry.replayIntegration({
      // Mask everything by default: covers passwords, payment fields, auth
      // tokens and AI Tutor conversations. Opt-out is never automatic.
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
      block: ['[data-sentry-block]', '[data-ai-tutor]'],
    }),
  ],
});

// Instruments App Router navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

/**
 * Dev-only workaround for React 19 + Turbopack aborting RSC layouts (redirect,
 * notFound) before performance marks close, which throws:
 * "Failed to execute 'measure' on 'Performance': '<Component>' cannot have a
 * negative time stamp."
 *
 * @see https://github.com/vercel/next.js/issues/86060
 */
if (process.env.NODE_ENV === 'development') {
  const perf = globalThis.performance;

  if (perf && typeof perf.measure === 'function') {
    const original = perf.measure.bind(perf);

    perf.measure = ((...args: Parameters<typeof original>) => {
      try {
        return original(...args);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const name = error instanceof Error ? error.name : '';

        if (
          message.includes('negative time stamp') ||
          name === 'InvalidAccessError' ||
          name === 'SyntaxError'
        ) {
          return undefined as unknown as PerformanceMeasure;
        }

        throw error;
      }
    }) as typeof perf.measure;
  }
}
