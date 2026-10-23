import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Expose the resolved Sentry environment to the browser bundle so client
  // events carry the same environment as server events. Must be set at BUILD
  // time (SENTRY_ENVIRONMENT=staging|production). Not a secret.
  env: {
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT ?? '',
  },
  // Standalone output is for self-hosted/Docker builds only. On Vercel it
  // conflicts with the deployment adapter and breaks the build on Next.js 16.3+.
  ...(isVercel ? {} : { output: 'standalone' as const }),
  reactCompiler: true,
  outputFileTracingIncludes: {
    '/*': ['./src/generated/prisma/**/*'],
  },
  serverExternalPackages: [
    '@opentelemetry/api',
    '@opentelemetry/exporter-metrics-otlp-http',
    '@opentelemetry/exporter-prometheus',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/instrumentation-http',
    '@opentelemetry/instrumentation-ioredis',
    '@opentelemetry/resources',
    '@opentelemetry/sdk-metrics',
    '@opentelemetry/sdk-node',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/semantic-conventions',
    '@prisma/instrumentation',
    'import-in-the-middle',
    'require-in-the-middle',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env.SENTRY_ORG ?? 'ithracode',

  project: process.env.SENTRY_PROJECT ?? 'ithracode-web',

  // SENTRY_AUTH_TOKEN is read from the build environment by the plugin. It is
  // a build-time secret only - never prefix it with NEXT_PUBLIC_.

  sourcemaps: {
    // Upload then delete, so .map files are never served publicly.
    deleteSourcemapsAfterUpload: true,
  },

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
