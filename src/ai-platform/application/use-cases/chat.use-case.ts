import { randomUUID } from 'node:crypto';

import { chatRequestSchema, type ChatRequest } from '../dto/chat.dto';
import { getLlmPort } from '../../infrastructure/di/ai-platform.container';
import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  completeAgentRun,
  failAgentRun,
  startAgentRun,
} from '../../observability/cost/cost-ledger.service';
import { PlatformError, PlatformErrorCodes } from '../../shared/errors';
import { LlmError, LlmErrorCodes } from '../../domain/ports/llm.port';
import type { ChatResult, ChatStreamEvent } from '../../shared/types';
import { runAgent, streamAgent } from './run-agent.use-case';

const DEFAULT_SYSTEM_PROMPTS = {
  ar: 'أنت مساعد ذكي مفيد. أجب بوضوح وباختصار.',
  en: 'You are a helpful AI assistant. Answer clearly and concisely.',
} as const;

function assertPlatformReady(): void {
  if (!AIPlatformConfig.isEnabled()) {
    throw new PlatformError(
      PlatformErrorCodes.AI_DISABLED,
      'AI Platform is disabled. Set AI_PLATFORM_ENABLED=true to use platform APIs.',
    );
  }
}

function parseChatRequest(request: ChatRequest): ChatRequest {
  const parsed = chatRequestSchema.safeParse(request);
  if (!parsed.success) {
    throw new PlatformError(
      PlatformErrorCodes.VALIDATION_ERROR,
      'Invalid chat request',
      false,
      { issues: parsed.error.issues },
    );
  }
  return parsed.data;
}

function resolveSystemPrompt(locale?: string): string {
  if (locale?.startsWith('ar')) {
    return DEFAULT_SYSTEM_PROMPTS.ar;
  }
  return DEFAULT_SYSTEM_PROMPTS.en;
}

function mapLlmError(error: unknown): PlatformError {
  if (error instanceof LlmError) {
    const code =
      error.code === LlmErrorCodes.RATE_LIMITED
        ? PlatformErrorCodes.RATE_LIMITED
        : error.code === LlmErrorCodes.SERVICE_UNAVAILABLE
          ? PlatformErrorCodes.PROVIDER_UNAVAILABLE
          : PlatformErrorCodes.RUNTIME_ERROR;

    return new PlatformError(code, error.message, error.retryable);
  }

  if (error instanceof PlatformError) {
    return error;
  }

  return new PlatformError(
    PlatformErrorCodes.RUNTIME_ERROR,
    error instanceof Error ? error.message : 'Unknown runtime error',
    false,
  );
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function buildConversationMessages(request: ChatRequest) {
  return request.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function toAgentRunRequest(request: ChatRequest) {
  const lastUserMessage = [...request.messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMessage) {
    throw new PlatformError(
      PlatformErrorCodes.VALIDATION_ERROR,
      'Chat request must include a user message',
    );
  }

  return {
    userId: request.scope.userId,
    input: lastUserMessage.content,
    locale: request.options?.locale?.startsWith('ar') ? ('ar' as const) : ('en' as const),
    scope: {
      userId: request.scope.userId,
      courseId: request.scope.courseId,
      lectureId: request.scope.lectureId,
      threadId: request.options?.threadId,
      conversationId: request.options?.conversationId,
    },
    options: {
      locale: request.options?.locale,
    },
  };
}

export async function chat(request: ChatRequest): Promise<ChatResult> {
  assertPlatformReady();
  const parsed = parseChatRequest(request);

  if (AIPlatformConfig.isRuntimeEnabled()) {
    const result = await runAgent(parsed.appId, toAgentRunRequest(parsed));
    return {
      runId: result.runId,
      content: result.output,
      usage: {
        promptTokens: result.tokensUsed.input,
        completionTokens: result.tokensUsed.output,
        totalTokens: result.tokensUsed.input + result.tokensUsed.output,
        estimatedCostUsd: result.estimatedCost,
      },
    };
  }

  const runId = randomUUID();
  const startedAt = Date.now();
  const llmConfig = AIPlatformConfig.getLlmConfig();

  await startAgentRun({
    runId,
    agentId: parsed.appId,
    userId: parsed.scope.userId,
    model: llmConfig.model,
    metadata: {
      courseId: parsed.scope.courseId,
      lectureId: parsed.scope.lectureId,
    },
  });

  try {
    const llmPort = getLlmPort();
    const systemPrompt = resolveSystemPrompt(parsed.options?.locale);
    const tokens: string[] = [];

    for await (const token of llmPort.streamAnswer({
      systemPrompt,
      messages: buildConversationMessages(parsed),
    })) {
      tokens.push(token);
    }

    const content = tokens.join('');
    const inputTokens = estimateTokens(
      `${systemPrompt}\n${parsed.messages.map((message) => message.content).join('\n')}`,
    );
    const outputTokens = estimateTokens(content);
    const latencyMs = Date.now() - startedAt;

    await completeAgentRun({
      runId,
      inputTokens,
      outputTokens,
      latencyMs,
    });

    return {
      runId,
      content,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    };
  } catch (error) {
    await failAgentRun(runId, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw mapLlmError(error);
  }
}

export async function* chatStream(request: ChatRequest): AsyncGenerator<ChatStreamEvent> {
  assertPlatformReady();
  const parsed = parseChatRequest(request);

  if (AIPlatformConfig.isRuntimeEnabled()) {
    yield* streamAgent(parsed.appId, toAgentRunRequest(parsed));
    return;
  }

  const runId = randomUUID();
  const startedAt = Date.now();
  const llmConfig = AIPlatformConfig.getLlmConfig();

  await startAgentRun({
    runId,
    agentId: parsed.appId,
    userId: parsed.scope.userId,
    model: llmConfig.model,
    metadata: {
      courseId: parsed.scope.courseId,
      lectureId: parsed.scope.lectureId,
    },
  });

  yield { type: 'meta', runId };

  const tokens: string[] = [];

  try {
    const llmPort = getLlmPort();
    const systemPrompt = resolveSystemPrompt(parsed.options?.locale);

    for await (const token of llmPort.streamAnswer({
      systemPrompt,
      messages: buildConversationMessages(parsed),
    })) {
      tokens.push(token);
      yield { type: 'token', text: token };
    }

    const content = tokens.join('');
    const inputTokens = estimateTokens(
      `${systemPrompt}\n${parsed.messages.map((message) => message.content).join('\n')}`,
    );
    const outputTokens = estimateTokens(content);
    const latencyMs = Date.now() - startedAt;

    await completeAgentRun({
      runId,
      inputTokens,
      outputTokens,
      latencyMs,
    });

    yield {
      type: 'done',
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    };
  } catch (error) {
    await failAgentRun(runId, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const mapped = mapLlmError(error);
    yield {
      type: 'error',
      code: mapped.code,
      message: mapped.message,
      retryable: mapped.retryable,
    };
  }
}

export { runAgent, streamAgent } from './run-agent.use-case';
