import { chatRequestSchema, type ChatRequest } from '../dto/chat.dto';
import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import { PlatformError, PlatformErrorCodes } from '../../shared/errors';
import type { ChatResult, ChatStreamEvent } from '../../shared/types';
import { runAgent, streamAgent } from './run-agent.use-case';

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

function toAgentRunRequest(request: ChatRequest) {
  const lastUserMessage = [...request.messages]
    .reverse()
    .find((m) => m.role === 'user');
  if (!lastUserMessage) {
    throw new PlatformError(
      PlatformErrorCodes.VALIDATION_ERROR,
      'Chat request must include a user message',
    );
  }

  return {
    userId: request.scope.userId,
    input: lastUserMessage.content,
    locale: request.options?.locale?.startsWith('ar')
      ? ('ar' as const)
      : ('en' as const),
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

  const result = await runAgent(parsed.appId, toAgentRunRequest(parsed));
  return {
    runId: result.runId,
    content: result.output,
    usage: {
      promptTokens: result.tokensUsed.input,
      completionTokens: result.tokensUsed.output,
      totalTokens: result.tokensUsed.input + result.tokensUsed.output,
      estimatedCostUsd: result.estimatedCost,
      tokenUsageEstimated: result.tokensUsed.tokenUsageEstimated,
    },
  };
}

export async function* chatStream(
  request: ChatRequest,
): AsyncGenerator<ChatStreamEvent> {
  assertPlatformReady();
  const parsed = parseChatRequest(request);

  yield* streamAgent(parsed.appId, toAgentRunRequest(parsed));
}

export { runAgent, streamAgent } from './run-agent.use-case';
