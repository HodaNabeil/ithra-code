import path from 'node:path';

import { config as loadEnv } from 'dotenv';

// Load project .env so integration tests use the same DATABASE_URL as prisma CLI.
loadEnv({ path: path.resolve(process.cwd(), '.env'), quiet: true });

process.env.SKIP_ENV_VALIDATION = 'true';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.AUTH_SECRET = 'test-secret-test-secret-test-secret';
process.env.AUTH_URL = 'http://localhost:3000';
process.env.AUTH_GOOGLE_ID = 'test';
process.env.AUTH_GOOGLE_SECRET = 'test';
process.env.AUTH_GITHUB_ID = 'test';
process.env.AUTH_GITHUB_SECRET = 'test';
process.env.STRIPE_API_KEY = 'sk_test';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test';
process.env.AI_PLATFORM_ENABLED = 'false';
process.env.AI_TUTOR_ENABLED = 'false';
