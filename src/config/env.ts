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
    PAYMOB_API_KEY: z
      .string()
      .optional()
      .describe(
        'Paymob legacy API key (auth token for transaction inquiry / reconcile)',
      ),
    PAYMOB_INTEGRATION_IDS: z
      .string()
      .optional()
      .describe('Comma-separated Paymob payment integration IDs'),

    // Payment reconciliation
    PAYMENT_RECONCILE_THRESHOLD_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(30)
      .describe('Reconcile payments older than this many minutes'),
    PAYMENT_RECONCILE_BATCH_SIZE: z.coerce
      .number()
      .int()
      .positive()
      .default(50)
      .describe('Max payments processed per reconciliation batch'),
    PAYMENT_RECONCILE_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(900_000)
      .describe('Reconciliation worker interval in milliseconds (default 15 min)'),

    PAYMENT_RECONCILE_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .positive()
      .default(8)
      .describe('Max automatic reconcile attempts before abandon/manual review'),

    PAYMENT_RECONCILE_MAX_WINDOW_HOURS: z.coerce
      .number()
      .int()
      .positive()
      .default(24)
      .describe('Max age of a payment eligible for automatic reconciliation'),

    PAYMENT_RECONCILE_BACKOFF_BASE_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(30)
      .describe('Base backoff delay for reconcile retries'),

    PAYMENT_RECONCILE_BACKOFF_CAP_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(720)
      .describe('Maximum backoff delay between reconcile attempts (default 12h)'),

    PAYMENT_RECONCILE_ABANDON_NOT_FOUND_COUNT: z.coerce
      .number()
      .int()
      .positive()
      .default(3)
      .describe(
        'Consecutive not_found outcomes required before abandon (with expired session)',
      ),

    PAYMENT_RECONCILE_USE_QUEUE: z
      .enum(['true', 'false'])
      .default('false')
      .describe('Enqueue claimed payments to BullMQ instead of inline processing'),

    PAYMENT_RECONCILE_RATE_LIMIT_PER_MINUTE: z.coerce
      .number()
      .int()
      .positive()
      .default(60)
      .describe('Max provider inquiry calls per minute per PSP'),

    PAYMENT_RECONCILE_ADMIN_SECRET: z
      .string()
      .optional()
      .describe('Bearer token for /api/admin/payment/reconcile'),

    PAYMENT_RECONCILE_SHUTDOWN_GRACE_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(30_000)
      .describe('Grace period for in-flight reconcile batch on SIGTERM'),

    PAYMOB_CIRCUIT_BREAKER_THRESHOLD: z.coerce
      .number()
      .int()
      .positive()
      .default(5)
      .describe('Consecutive Paymob inquiry failures before circuit opens'),

    PAYMOB_CIRCUIT_BREAKER_RESET_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60_000)
      .describe('Milliseconds before Paymob inquiry circuit half-opens'),

    PAYMOB_WEBHOOK_REPLAY_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(300)
      .describe('Reject Paymob webhooks older than this many seconds'),

    PAYMOB_RETRY_MAX: z.coerce
      .number()
      .int()
      .positive()
      .default(3)
      .describe('Max retry attempts for transient Paymob HTTP failures'),

    PAYMOB_RETRY_INITIAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(1000)
      .describe('Initial backoff delay for Paymob HTTP retries'),

    PAYMOB_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15_000)
      .describe('HTTP request timeout for Paymob API calls'),

    RESEND_API_KEY: z
      .string()
      .optional()
      .describe('Resend API key for purchase confirmation emails'),

    PAYMENT_EMAIL_FROM: z
      .string()
      .email()
      .optional()
      .describe('From address for payment confirmation emails'),

    PAYMENT_ANALYTICS_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .describe('Enable analytics tracking for completed orders'),

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

    // AI Platform (shared module — scaffold; parallel to AI Tutor during migration)
    AI_PLATFORM_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .describe('Enable AI Platform module (required when AI_TUTOR_ENABLED=true)'),
    AI_PLATFORM_LLM_MODEL: z
      .string()
      .optional()
      .describe('Default LLM model for platform agents'),
    AI_PLATFORM_EMBEDDING_MODEL: z
      .string()
      .optional()
      .describe('Default embedding model for platform RAG'),
    AI_PLATFORM_LLM_TIMEOUT_MS: z
      .string()
      .optional()
      .describe('LLM request timeout in milliseconds'),
    AI_PLATFORM_LLM_MAX_TOKENS: z
      .string()
      .optional()
      .describe('Default max completion tokens for platform LLM calls'),
    AI_PLATFORM_HISTORY_TOKEN_BUDGET: z
      .string()
      .optional()
      .describe('Max estimated tokens for conversation history sent to the LLM'),
    AI_PLATFORM_TOP_K: z
      .string()
      .optional()
      .describe('Default top-K for vector retrieval'),
    AI_PLATFORM_MIN_SIMILARITY: z
      .string()
      .optional()
      .describe('Default minimum cosine similarity for retrieval (0-1)'),
    AI_PLATFORM_LECTURE_FALLBACK_MIN_SIMILARITY: z
      .string()
      .optional()
      .describe('Minimum similarity when lecture-scoped retrieval fallback is used'),
    AI_PLATFORM_DAILY_COST_CAP: z
      .string()
      .optional()
      .describe('Deprecated request-count cap (unused; see *_DAILY_BUDGET_USD)'),
    AI_PLATFORM_USER_DAILY_BUDGET_USD: z
      .string()
      .optional()
      .describe('Per-user daily AI spend cap in USD (0 = disabled)'),
    AI_PLATFORM_GLOBAL_DAILY_BUDGET_USD: z
      .string()
      .optional()
      .describe('Global daily AI spend safety-net cap in USD (0 = disabled)'),
    AI_PLATFORM_RATE_LIMIT_PER_MINUTE: z
      .string()
      .optional()
      .describe('Per-user AI message rate limit per minute'),
    AI_PLATFORM_RATE_LIMIT_PER_HOUR: z
      .string()
      .optional()
      .describe('Per-user AI message rate limit per hour'),
    AI_PLATFORM_RATE_LIMIT_PER_DAY: z
      .string()
      .optional()
      .describe('Per-user AI message rate limit per day'),
    ANTHROPIC_API_KEY: z
      .string()
      .optional()
      .describe('Anthropic API key for multi-provider routing (Phase 3)'),
    GOOGLE_AI_API_KEY: z
      .string()
      .optional()
      .describe('Google AI API key for Gemini provider (Phase 3)'),
    AI_PLATFORM_MCP_SERVERS: z
      .string()
      .optional()
      .describe('JSON array of MCP server configurations (Phase 3)'),

    // Langfuse prompt management
    LANGFUSE_PUBLIC_KEY: z.string().optional().describe('Langfuse public API key'),
    LANGFUSE_SECRET_KEY: z.string().optional().describe('Langfuse secret API key'),
    LANGFUSE_HOST: z
      .string()
      .url()
      .optional()
      .describe('Langfuse API host (default: cloud.langfuse.com)'),
    LANGFUSE_PROMPT_LABEL: z
      .enum(['development', 'staging', 'production'])
      .optional()
      .default('production')
      .describe('Langfuse prompt label for runtime resolution'),
    LANGFUSE_PROMPT_CACHE_TTL_MS: z
      .string()
      .optional()
      .describe('In-memory prompt cache TTL in milliseconds'),

    // LangSmith tracing
    LANGCHAIN_TRACING_V2: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .describe('Enable LangSmith tracing'),
    LANGCHAIN_API_KEY: z.string().optional().describe('LangSmith API key'),
    LANGCHAIN_PROJECT: z
      .string()
      .optional()
      .default('ithracode-ai-platform')
      .describe('LangSmith project name'),
    LANGCHAIN_ENDPOINT: z
      .string()
      .url()
      .optional()
      .describe('LangSmith API endpoint'),
    LANGSMITH_PII_SALT: z
      .string()
      .optional()
      .describe('Salt used when hashing identifiers before LangSmith export'),

    // OpenTelemetry
    OTEL_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .describe('Enable OpenTelemetry instrumentation'),
    OTEL_SERVICE_NAME: z
      .string()
      .optional()
      .default('ithracode-ai-platform')
      .describe('OTEL service name'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z
      .string()
      .url()
      .optional()
      .describe('OTLP trace exporter endpoint'),
    OTEL_METRICS_PORT: z
      .string()
      .optional()
      .describe('Prometheus metrics exporter port'),

    // AI admin API
    AI_ADMIN_API_SECRET: z
      .string()
      .optional()
      .describe('Bearer secret for /api/admin/ai/* endpoints'),

    // AI Tutor
    AI_TUTOR_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .describe('Enable AI Tutor feature'),
    OPENAI_API_KEY: z
      .string()
      .optional()
      .describe('LLM API key (OpenAI or OpenRouter)'),
    OPENAI_BASE_URL: z
      .string()
      .url()
      .optional()
      .describe('Optional LLM API base URL (e.g. OpenRouter)'),
    AI_TUTOR_LLM_MODEL: z
      .string()
      .optional()
      .describe('LLM model id (e.g. openai/gpt-4o-mini on OpenRouter)'),
    AI_TUTOR_EMBEDDING_MODEL: z
      .string()
      .optional()
      .describe('Embedding model id (e.g. openai/text-embedding-3-small)'),
    AI_TUTOR_TOP_K: z
      .string()
      .optional()
      .describe('Max knowledge chunks to retrieve per question'),
    AI_TUTOR_MIN_SIMILARITY: z
      .string()
      .optional()
      .describe('Minimum cosine similarity threshold for retrieval (0-1)'),
    AI_TUTOR_LECTURE_FALLBACK_MIN_SIMILARITY: z
      .string()
      .optional()
      .describe('Lecture fallback minimum similarity for tutor retrieval'),
    INTERNAL_HEALTH_TOKEN: z
      .string()
      .optional()
      .describe('Bearer token for detailed internal health endpoints'),
    AI_TUTOR_DAILY_COST_CAP: z
      .string()
      .optional()
      .describe('Deprecated request-count cap (unused; see AI_TUTOR_USER_DAILY_BUDGET_USD)'),
    AI_TUTOR_USER_DAILY_BUDGET_USD: z
      .string()
      .optional()
      .describe('Per-user daily AI tutor spend cap in USD (0 = disabled)'),
    COURSE_INDEXING_CONCURRENCY: z
      .string()
      .optional()
      .describe('BullMQ worker concurrency for course indexing jobs'),
    KNOWLEDGE_INGESTION_SOURCE_CONCURRENCY: z
      .string()
      .optional()
      .describe('Parallel source ingestion concurrency within a single indexing job'),
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
    PAYMOB_API_KEY: process.env.PAYMOB_API_KEY,
    PAYMOB_INTEGRATION_IDS: process.env.PAYMOB_INTEGRATION_IDS,
    PAYMENT_RECONCILE_THRESHOLD_MINUTES:
      process.env.PAYMENT_RECONCILE_THRESHOLD_MINUTES,
    PAYMENT_RECONCILE_BATCH_SIZE: process.env.PAYMENT_RECONCILE_BATCH_SIZE,
    PAYMENT_RECONCILE_INTERVAL_MS: process.env.PAYMENT_RECONCILE_INTERVAL_MS,
    PAYMENT_RECONCILE_MAX_ATTEMPTS: process.env.PAYMENT_RECONCILE_MAX_ATTEMPTS,
    PAYMENT_RECONCILE_MAX_WINDOW_HOURS:
      process.env.PAYMENT_RECONCILE_MAX_WINDOW_HOURS,
    PAYMENT_RECONCILE_BACKOFF_BASE_MINUTES:
      process.env.PAYMENT_RECONCILE_BACKOFF_BASE_MINUTES,
    PAYMENT_RECONCILE_BACKOFF_CAP_MINUTES:
      process.env.PAYMENT_RECONCILE_BACKOFF_CAP_MINUTES,
    PAYMENT_RECONCILE_ABANDON_NOT_FOUND_COUNT:
      process.env.PAYMENT_RECONCILE_ABANDON_NOT_FOUND_COUNT,
    PAYMENT_RECONCILE_USE_QUEUE: process.env.PAYMENT_RECONCILE_USE_QUEUE,
    PAYMENT_RECONCILE_RATE_LIMIT_PER_MINUTE:
      process.env.PAYMENT_RECONCILE_RATE_LIMIT_PER_MINUTE,
    PAYMENT_RECONCILE_ADMIN_SECRET: process.env.PAYMENT_RECONCILE_ADMIN_SECRET,
    PAYMENT_RECONCILE_SHUTDOWN_GRACE_MS:
      process.env.PAYMENT_RECONCILE_SHUTDOWN_GRACE_MS,
    PAYMOB_CIRCUIT_BREAKER_THRESHOLD:
      process.env.PAYMOB_CIRCUIT_BREAKER_THRESHOLD,
    PAYMOB_CIRCUIT_BREAKER_RESET_MS: process.env.PAYMOB_CIRCUIT_BREAKER_RESET_MS,
    PAYMOB_WEBHOOK_REPLAY_WINDOW_SECONDS:
      process.env.PAYMOB_WEBHOOK_REPLAY_WINDOW_SECONDS,
    PAYMOB_RETRY_MAX: process.env.PAYMOB_RETRY_MAX,
    PAYMOB_RETRY_INITIAL_MS: process.env.PAYMOB_RETRY_INITIAL_MS,
    PAYMOB_TIMEOUT_MS: process.env.PAYMOB_TIMEOUT_MS,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    PAYMENT_EMAIL_FROM: process.env.PAYMENT_EMAIL_FROM,
    PAYMENT_ANALYTICS_ENABLED: process.env.PAYMENT_ANALYTICS_ENABLED,
    REDIS_URL: process.env.REDIS_URL,
    MUX_TOKEN_ID: process.env.MUX_TOKEN_ID,
    MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    AI_PLATFORM_ENABLED: process.env.AI_PLATFORM_ENABLED,
    AI_PLATFORM_LLM_MODEL: process.env.AI_PLATFORM_LLM_MODEL,
    AI_PLATFORM_EMBEDDING_MODEL: process.env.AI_PLATFORM_EMBEDDING_MODEL,
    AI_PLATFORM_LLM_TIMEOUT_MS: process.env.AI_PLATFORM_LLM_TIMEOUT_MS,
    AI_PLATFORM_LLM_MAX_TOKENS: process.env.AI_PLATFORM_LLM_MAX_TOKENS,
    AI_PLATFORM_HISTORY_TOKEN_BUDGET: process.env.AI_PLATFORM_HISTORY_TOKEN_BUDGET,
    AI_PLATFORM_TOP_K: process.env.AI_PLATFORM_TOP_K,
    AI_PLATFORM_MIN_SIMILARITY: process.env.AI_PLATFORM_MIN_SIMILARITY,
    AI_PLATFORM_LECTURE_FALLBACK_MIN_SIMILARITY:
      process.env.AI_PLATFORM_LECTURE_FALLBACK_MIN_SIMILARITY,
    AI_PLATFORM_DAILY_COST_CAP: process.env.AI_PLATFORM_DAILY_COST_CAP,
    AI_PLATFORM_USER_DAILY_BUDGET_USD: process.env.AI_PLATFORM_USER_DAILY_BUDGET_USD,
    AI_PLATFORM_GLOBAL_DAILY_BUDGET_USD: process.env.AI_PLATFORM_GLOBAL_DAILY_BUDGET_USD,
    AI_PLATFORM_RATE_LIMIT_PER_MINUTE: process.env.AI_PLATFORM_RATE_LIMIT_PER_MINUTE,
    AI_PLATFORM_RATE_LIMIT_PER_HOUR: process.env.AI_PLATFORM_RATE_LIMIT_PER_HOUR,
    AI_PLATFORM_RATE_LIMIT_PER_DAY: process.env.AI_PLATFORM_RATE_LIMIT_PER_DAY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    AI_PLATFORM_MCP_SERVERS: process.env.AI_PLATFORM_MCP_SERVERS,
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
    LANGFUSE_HOST: process.env.LANGFUSE_HOST,
    LANGFUSE_PROMPT_LABEL: process.env.LANGFUSE_PROMPT_LABEL,
    LANGFUSE_PROMPT_CACHE_TTL_MS: process.env.LANGFUSE_PROMPT_CACHE_TTL_MS,
    LANGCHAIN_TRACING_V2: process.env.LANGCHAIN_TRACING_V2,
    LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY,
    LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT,
    LANGCHAIN_ENDPOINT: process.env.LANGCHAIN_ENDPOINT,
    LANGSMITH_PII_SALT: process.env.LANGSMITH_PII_SALT,
    OTEL_ENABLED: process.env.OTEL_ENABLED,
    OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    OTEL_METRICS_PORT: process.env.OTEL_METRICS_PORT,
    AI_ADMIN_API_SECRET: process.env.AI_ADMIN_API_SECRET,
    AI_TUTOR_ENABLED: process.env.AI_TUTOR_ENABLED,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    AI_TUTOR_LLM_MODEL: process.env.AI_TUTOR_LLM_MODEL,
    AI_TUTOR_EMBEDDING_MODEL: process.env.AI_TUTOR_EMBEDDING_MODEL,
    AI_TUTOR_TOP_K: process.env.AI_TUTOR_TOP_K,
    AI_TUTOR_MIN_SIMILARITY: process.env.AI_TUTOR_MIN_SIMILARITY,
    AI_TUTOR_LECTURE_FALLBACK_MIN_SIMILARITY:
      process.env.AI_TUTOR_LECTURE_FALLBACK_MIN_SIMILARITY,
    INTERNAL_HEALTH_TOKEN: process.env.INTERNAL_HEALTH_TOKEN,
    AI_TUTOR_DAILY_COST_CAP: process.env.AI_TUTOR_DAILY_COST_CAP,
    AI_TUTOR_USER_DAILY_BUDGET_USD: process.env.AI_TUTOR_USER_DAILY_BUDGET_USD,
    COURSE_INDEXING_CONCURRENCY: process.env.COURSE_INDEXING_CONCURRENCY,
    KNOWLEDGE_INGESTION_SOURCE_CONCURRENCY:
      process.env.KNOWLEDGE_INGESTION_SOURCE_CONCURRENCY,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
