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
