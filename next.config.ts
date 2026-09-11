import type { NextConfig } from 'next';

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
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

export default nextConfig;
