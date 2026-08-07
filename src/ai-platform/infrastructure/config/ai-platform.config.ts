import { env } from '@/config/env';
import { logger } from '@/lib/logger';

import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';

export class AIPlatformConfig {
  static isEnabled(): boolean {
    return env.AI_PLATFORM_ENABLED === 'true';
  }

  static getLlmApiKey(): string {
    if (!this.isEnabled()) {
      throw new Error('AI Platform is disabled');
    }

    const key = env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    return key;
  }

  static getLlmBaseUrl(): string | undefined {
    return env.OPENAI_BASE_URL;
  }

  static isOpenRouter(): boolean {
    return this.getLlmBaseUrl()?.includes('openrouter.ai') ?? false;
  }

  static getEmbeddingConfig() {
    const model =
      env.AI_PLATFORM_EMBEDDING_MODEL ??
      env.AI_TUTOR_EMBEDDING_MODEL ??
      (this.isOpenRouter() ? 'openai/text-embedding-3-small' : 'text-embedding-3-small');

    return {
      model,
      dimensions: AI_PLATFORM_CONSTANTS.EMBEDDING_DIMENSIONS,
      baseURL: env.OPENAI_BASE_URL,
    };
  }

  static getLlmConfig() {
    const timeoutMs = env.AI_PLATFORM_LLM_TIMEOUT_MS
      ? Number(env.AI_PLATFORM_LLM_TIMEOUT_MS)
      : AI_PLATFORM_CONSTANTS.REQUEST_TIMEOUT_MS;

    const maxTokens = env.AI_PLATFORM_LLM_MAX_TOKENS
      ? Number(env.AI_PLATFORM_LLM_MAX_TOKENS)
      : AI_PLATFORM_CONSTANTS.MAX_RESPONSE_TOKENS;

    return {
      model:
        env.AI_PLATFORM_LLM_MODEL ??
        env.AI_TUTOR_LLM_MODEL ??
        'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens,
      requestTimeoutMs: timeoutMs,
      baseURL: env.OPENAI_BASE_URL,
    };
  }

  static getRetrievalConfig() {
    const topK = env.AI_PLATFORM_TOP_K
      ? Number(env.AI_PLATFORM_TOP_K)
      : env.AI_TUTOR_TOP_K
        ? Number(env.AI_TUTOR_TOP_K)
        : AI_PLATFORM_CONSTANTS.DEFAULT_TOP_K;

    const minSimilarity = env.AI_PLATFORM_MIN_SIMILARITY
      ? Number(env.AI_PLATFORM_MIN_SIMILARITY)
      : env.AI_TUTOR_MIN_SIMILARITY
        ? Number(env.AI_TUTOR_MIN_SIMILARITY)
        : AI_PLATFORM_CONSTANTS.DEFAULT_MIN_SIMILARITY;

    const lectureFallbackMinSimilarity = env.AI_PLATFORM_LECTURE_FALLBACK_MIN_SIMILARITY
      ? Number(env.AI_PLATFORM_LECTURE_FALLBACK_MIN_SIMILARITY)
      : env.AI_TUTOR_LECTURE_FALLBACK_MIN_SIMILARITY
        ? Number(env.AI_TUTOR_LECTURE_FALLBACK_MIN_SIMILARITY)
        : AI_PLATFORM_CONSTANTS.DEFAULT_LECTURE_FALLBACK_MIN_SIMILARITY;

    return { topK, minSimilarity, lectureFallbackMinSimilarity };
  }

  static getIndexingWorkerConcurrency(): number {
    const value = Number(env.COURSE_INDEXING_CONCURRENCY);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  }

  static getKnowledgeIngestionSourceConcurrency(): number {
    const value = Number(env.KNOWLEDGE_INGESTION_SOURCE_CONCURRENCY);
    return Number.isFinite(value) && value > 0
      ? Math.floor(value)
      : AI_PLATFORM_CONSTANTS.KNOWLEDGE_INGESTION_SOURCE_CONCURRENCY;
  }

  static getRateLimitConfig() {
    const perMinute = Number(env.AI_PLATFORM_RATE_LIMIT_PER_MINUTE);
    const perHour = Number(env.AI_PLATFORM_RATE_LIMIT_PER_HOUR);
    const perDay = Number(env.AI_PLATFORM_RATE_LIMIT_PER_DAY);

    return {
      requestsPerMinute:
        Number.isFinite(perMinute) && perMinute > 0
          ? Math.floor(perMinute)
          : AI_PLATFORM_CONSTANTS.RATE_LIMIT_REQUESTS_PER_MINUTE,
      requestsPerHour:
        Number.isFinite(perHour) && perHour > 0
          ? Math.floor(perHour)
          : AI_PLATFORM_CONSTANTS.RATE_LIMIT_REQUESTS_PER_HOUR,
      requestsPerDay:
        Number.isFinite(perDay) && perDay > 0
          ? Math.floor(perDay)
          : AI_PLATFORM_CONSTANTS.RATE_LIMIT_REQUESTS_PER_DAY,
    };
  }

  static getStreamConfig() {
    const timeoutMs = env.AI_PLATFORM_LLM_TIMEOUT_MS
      ? Number(env.AI_PLATFORM_LLM_TIMEOUT_MS)
      : AI_PLATFORM_CONSTANTS.REQUEST_TIMEOUT_MS;

    return {
      maxConcurrentStreamsPerUser: AI_PLATFORM_CONSTANTS.MAX_CONCURRENT_STREAMS_PER_USER,
      requestTimeoutMs: timeoutMs,
    };
  }

  static getDailyCostCap(): number {
    const platformCap = Number(env.AI_PLATFORM_DAILY_COST_CAP);
    if (Number.isFinite(platformCap) && platformCap > 0) {
      return Math.floor(platformCap);
    }

    const tutorCap = Number(env.AI_TUTOR_DAILY_COST_CAP);
    return Number.isFinite(tutorCap) && tutorCap > 0 ? Math.floor(tutorCap) : 0;
  }

  /** Per-user daily USD budget (0 = disabled). */
  static getUserDailyBudgetUsd(): number {
    const tutorCap = Number(env.AI_TUTOR_USER_DAILY_BUDGET_USD);
    if (Number.isFinite(tutorCap) && tutorCap > 0) {
      return tutorCap;
    }

    const platformCap = Number(env.AI_PLATFORM_USER_DAILY_BUDGET_USD);
    return Number.isFinite(platformCap) && platformCap > 0 ? platformCap : 0;
  }

  /** Global daily USD safety-net budget (0 = disabled). */
  static getGlobalDailyBudgetUsd(): number {
    const cap = Number(env.AI_PLATFORM_GLOBAL_DAILY_BUDGET_USD);
    return Number.isFinite(cap) && cap > 0 ? cap : 0;
  }

  static getLangfuseConfig() {
    return {
      enabled: Boolean(env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY),
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      host: env.LANGFUSE_HOST ?? 'https://cloud.langfuse.com',
    };
  }

  static getLangfusePromptLabel(): 'development' | 'staging' | 'production' {
    return env.LANGFUSE_PROMPT_LABEL ?? 'production';
  }

  static getPromptCacheTtlMs(): number {
    const value = Number(env.LANGFUSE_PROMPT_CACHE_TTL_MS);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 300_000;
  }

  static isLangSmithTracingEnabled(): boolean {
    return env.LANGCHAIN_TRACING_V2 === 'true' && Boolean(env.LANGCHAIN_API_KEY);
  }

  static getLangSmithConfig() {
    return {
      enabled: this.isLangSmithTracingEnabled(),
      apiKey: env.LANGCHAIN_API_KEY,
      project: env.LANGCHAIN_PROJECT ?? 'ithracode-ai-platform',
      endpoint: env.LANGCHAIN_ENDPOINT,
    };
  }

  static isOtelEnabled(): boolean {
    return env.OTEL_ENABLED === 'true';
  }

  static getOtelConfig() {
    const metricsPort = Number(env.OTEL_METRICS_PORT);
    return {
      enabled: this.isOtelEnabled(),
      serviceName: env.OTEL_SERVICE_NAME ?? 'ithracode-ai-platform',
      otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
      metricsPort: Number.isFinite(metricsPort) && metricsPort > 0 ? metricsPort : 9464,
    };
  }
}

export function validateAIPlatformConfig(): void {
  if (!AIPlatformConfig.isEnabled()) {
    return;
  }

  AIPlatformConfig.getLlmApiKey();

  const llm = AIPlatformConfig.getLlmConfig();
  const embedding = AIPlatformConfig.getEmbeddingConfig();

  logger.info(
    {
      llmModel: llm.model,
      embeddingModel: embedding.model,
      embeddingDimensions: embedding.dimensions,
    },
    '[AI_PLATFORM_CONFIG] Configuration validated',
  );
}
