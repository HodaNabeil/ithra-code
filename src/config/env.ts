import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development')
      .describe('Node environment'),

    // Database URL
    DATABASE_URL: z.string().url().describe('PostgreSQL database URL'),

    // NextAuth settings
    AUTH_URL: z.string().url().describe('NextAuth base URL'),
    NEXTAUTH_URL: z
      .string()
      .url()
      .optional()
      .describe('NextAuth base URL (legacy)'),
    AUTH_SECRET: z.string().describe('NextAuth secret key'),
    AUTH_TRUST_HOST: z.string().optional().default('true'),

    // OAuth Providers
    AUTH_GOOGLE_ID: z.string().describe('Google OAuth Client ID'),
    AUTH_GOOGLE_SECRET: z.string().describe('Google OAuth Client Secret'),
    AUTH_GITHUB_ID: z.string().describe('GitHub OAuth Client ID'),
    AUTH_GITHUB_SECRET: z.string().describe('GitHub OAuth Client Secret'),

    // Stripe
    STRIPE_API_KEY: z.string().describe('Stripe Secret API Key'),
    STRIPE_WEBHOOK_SECRET: z.string().describe('Stripe Webhook Secret'),

    // Paymob (optional: gateway registers only when configured)
    PAYMOB_API_URL: z
      .string()
      .url()
      .default('https://accept.paymob.com')
      .describe('Paymob API base URL'),
    PAYMOB_SECRET_KEY: z
      .string()
      .optional()
      .describe('Paymob secret key (Intention API auth)'),
    PAYMOB_PUBLIC_KEY: z
      .string()
      .optional()
      .describe('Paymob public key (unified checkout redirect)'),
    PAYMOB_HMAC_SECRET: z
      .string()
      .optional()
      .describe('Paymob HMAC secret (webhook signature verification)'),
    PAYMOB_INTEGRATION_IDS: z
      .string()
      .optional()
      .describe('Comma-separated Paymob payment integration IDs'),

    // Redis
    REDIS_URL: z.string().url().describe('Redis connection URL'),

    // Mux
    MUX_TOKEN_ID: z.string().describe('Mux Token ID'),
    MUX_TOKEN_SECRET: z.string().describe('Mux Token Secret'),

    // Optional cookie domain (production)
    COOKIE_DOMAIN: z
      .string()
      .optional()
      .describe('Cookie domain for production'),

    // Direct database URL (for migrations)
    DIRECT_URL: z
      .string()
      .url()
      .optional()
      .describe('Direct database URL for migrations'),

    // NextAuth trust host (v5 requirement)
  },

  client: {
    NEXT_PUBLIC_API_URL: z.string().url().optional().describe('API base URL'),
    NEXT_PUBLIC_APP_URL: z
      .string()
      .url()
      .default('http://localhost:3000')
      .describe('Next.js app public URL'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
      .string()
      .describe('Stripe Publishable Key'),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    STRIPE_API_KEY: process.env.STRIPE_API_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    PAYMOB_API_URL: process.env.PAYMOB_API_URL,
    PAYMOB_SECRET_KEY: process.env.PAYMOB_SECRET_KEY,
    PAYMOB_PUBLIC_KEY: process.env.PAYMOB_PUBLIC_KEY,
    PAYMOB_HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET,
    PAYMOB_INTEGRATION_IDS: process.env.PAYMOB_INTEGRATION_IDS,
    REDIS_URL: process.env.REDIS_URL,
    MUX_TOKEN_ID: process.env.MUX_TOKEN_ID,
    MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
