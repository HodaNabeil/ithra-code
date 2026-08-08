import { type Attributes, type Span } from '@opentelemetry/api';

import { hashIdentifier } from '../langsmith/trace-redactor';

const FORBIDDEN_ATTRIBUTE_KEYS = new Set([
  'prompt',
  'response',
  'content',
  'messages',
  'chunks',
  'authorization',
  'api_key',
  'apikey',
  'input_text',
  'output_text',
]);

const FORBIDDEN_ATTRIBUTE_SUFFIXES = ['.prompt', '.response', '.content', '.messages'];

const RAW_IDENTIFIER_KEYS: Record<string, string> = {
  'ai.user.id': 'ai.user.id_hash',
  'ai.course.id': 'ai.course.id_hash',
  'ai.lecture.id': 'ai.lecture.id_hash',
  'ai.thread.id': 'ai.thread.id_hash',
};

function isForbiddenAttributeKey(key: string): boolean {
  const normalized = key.toLowerCase();

  if (FORBIDDEN_ATTRIBUTE_KEYS.has(normalized)) {
    return true;
  }

  return FORBIDDEN_ATTRIBUTE_SUFFIXES.some((suffix) =>
    normalized.endsWith(suffix),
  );
}

function hashScopedIdentifier(key: string, value: string): string | undefined {
  if (value === 'none') {
    return value;
  }

  const hashedKey = RAW_IDENTIFIER_KEYS[key];
  return hashedKey ? hashedKey : undefined;
}

export function sanitizeOtelAttributes(attributes: Attributes): Attributes {
  const sanitized: Attributes = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (isForbiddenAttributeKey(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      continue;
    }

    if (typeof value === 'string' && key in RAW_IDENTIFIER_KEYS) {
      const hashedKey = hashScopedIdentifier(key, value);
      if (hashedKey === 'none') {
        sanitized[key] = value;
      } else if (hashedKey) {
        sanitized[hashedKey] = hashIdentifier(value);
      }
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

export function setSafeSpanAttributes(span: Span, attributes: Attributes): void {
  const sanitized = sanitizeOtelAttributes(attributes);

  for (const [key, value] of Object.entries(sanitized)) {
    if (value !== undefined && value !== null && !Array.isArray(value)) {
      span.setAttribute(key, value);
    }
  }
}

export function buildAgentRunSpanAttributes(params: {
  agentId: string;
  runId?: string;
  userId?: string;
  correlationId?: string;
  promptVersion?: string | number;
  mode?: 'stream' | 'execute';
}): Attributes {
  return sanitizeOtelAttributes({
    'ai.agent.id': params.agentId,
    'ai.run.id': params.runId,
    'ai.user.id': params.userId,
    'ai.correlation.id': params.correlationId,
    'ai.prompt.version':
      params.promptVersion !== undefined ? String(params.promptVersion) : undefined,
    'ai.agent.mode': params.mode,
  });
}

export function buildLedgerCompleteSpanAttributes(params: {
  runId: string;
  agentId: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  embeddingTokens: number;
  estimatedCostUsd: number;
  tokenUsageEstimated: boolean;
  latencyMs: number;
}): Attributes {
  return sanitizeOtelAttributes({
    'ai.run.id': params.runId,
    'ai.agent.id': params.agentId,
    'ai.model': params.model,
    'ai.provider': params.provider,
    'ai.tokens.input': params.inputTokens,
    'ai.tokens.output': params.outputTokens,
    'ai.tokens.embedding': params.embeddingTokens,
    'ai.cost.usd': params.estimatedCostUsd,
    'ai.usage.estimated': params.tokenUsageEstimated,
    'ai.latency.ms': params.latencyMs,
  });
}

export function buildScopeSpanAttributes(params: {
  courseId: string;
  lectureId?: string;
}): Attributes {
  return sanitizeOtelAttributes({
    'ai.course.id': params.courseId,
    'ai.lecture.id': params.lectureId ?? 'none',
  });
}
