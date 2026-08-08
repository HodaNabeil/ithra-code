import { context, trace } from '@opentelemetry/api';

import { logger } from '@/lib/logger';

import { getCurrentTraceContext } from '../langsmith/trace-context';

export type AiRunLogStatus = 'completed' | 'failed';

export type AiRunLogEvent = {
  event: 'ai.agent.run.completed' | 'ai.agent.run.failed';
  traceId?: string;
  spanId?: string;
  runId?: string;
  agentId?: string;
  correlationId?: string;
  model?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  embeddingTokens?: number;
  costUsd?: number;
  durationMs?: number;
  status: AiRunLogStatus;
  tokenUsageEstimated?: boolean;
  errorCode?: string;
};

const FORBIDDEN_LOG_KEYS = new Set([
  'prompt',
  'response',
  'content',
  'messages',
  'chunks',
  'input',
  'output',
  'authorization',
  'apiKey',
  'api_key',
]);

function resolveOtelTraceIds(): Pick<AiRunLogEvent, 'traceId' | 'spanId'> {
  const span = trace.getSpan(context.active());
  if (!span) {
    return {};
  }

  const spanContext = span.spanContext();
  if (!spanContext.traceId) {
    return {};
  }

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

export function buildAiRunLogEvent(
  event: AiRunLogEvent['event'],
  fields: Omit<AiRunLogEvent, 'event'>,
): AiRunLogEvent {
  const traceCtx = getCurrentTraceContext();
  const payload: AiRunLogEvent = {
    event,
    ...resolveOtelTraceIds(),
    runId: fields.runId ?? traceCtx?.runId,
    agentId: fields.agentId ?? traceCtx?.agentId,
    correlationId: fields.correlationId ?? traceCtx?.correlationId,
    model: fields.model,
    provider: fields.provider,
    inputTokens: fields.inputTokens,
    outputTokens: fields.outputTokens,
    embeddingTokens: fields.embeddingTokens,
    costUsd: fields.costUsd,
    durationMs: fields.durationMs,
    status: fields.status,
    tokenUsageEstimated: fields.tokenUsageEstimated,
    errorCode: fields.errorCode,
  };

  return sanitizeAiLogEvent(payload);
}

export function sanitizeAiLogEvent(event: AiRunLogEvent): AiRunLogEvent {
  const sanitized = { ...event };

  for (const key of Object.keys(sanitized)) {
    if (FORBIDDEN_LOG_KEYS.has(key.toLowerCase())) {
      delete sanitized[key as keyof AiRunLogEvent];
    }
  }

  return sanitized;
}

export function logAiRunEvent(
  event: AiRunLogEvent['event'],
  fields: Omit<AiRunLogEvent, 'event'>,
): void {
  try {
    const payload = buildAiRunLogEvent(event, fields);
    const message =
      event === 'ai.agent.run.completed'
        ? '[AI_AGENT_RUN_COMPLETED]'
        : '[AI_AGENT_RUN_FAILED]';

    if (payload.status === 'failed') {
      logger.warn(payload, message);
      return;
    }

    logger.info(payload, message);
  } catch (error) {
    logger.warn({ error, event }, '[AI_LOG] structured run log failed');
  }
}

export function logAgentRunCompleted(
  fields: Omit<AiRunLogEvent, 'event' | 'status'>,
): void {
  logAiRunEvent('ai.agent.run.completed', {
    ...fields,
    status: 'completed',
  });
}

export function logAgentRunFailed(
  fields: Omit<AiRunLogEvent, 'event' | 'status'> & { errorCode: string },
): void {
  logAiRunEvent('ai.agent.run.failed', {
    ...fields,
    status: 'failed',
  });
}
