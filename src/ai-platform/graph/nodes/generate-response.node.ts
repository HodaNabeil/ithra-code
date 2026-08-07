import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { z } from 'zod';

import { buildTutorSystemPrompt } from '../../prompts/tutor-system-prompt.builder';
import { listTools } from '../../tools/registry/tool-registry';
import type { TutorAgentState } from '../state/tutor-agent.state';
import { getGraphRuntimeConfig } from '../runtime-config';

/** Clearly-marked fallback — replace when provider usage is guaranteed */
function FALLBACK_estimateTokensFromChars(text: string): number {
  return Math.ceil(text.length / 4);
}

function buildMessages(state: TutorAgentState) {
  const userContent = state.sanitizedInput || state.input;
  const toolContext = state.toolResults
    .map((result) => `Tool result (${result.toolCallId}): ${JSON.stringify(result.output)}`)
    .join('\n');

  const messages = [...state.conversationHistory];

  if (toolContext) {
    messages.push({ role: 'assistant', content: toolContext });
  }

  messages.push({ role: 'user', content: userContent });
  return messages;
}

/**
 * Converts each registered tool's real Zod input schema into JSON Schema so
 * the LLM receives accurate parameter definitions instead of an opaque
 * `{ properties: {} }` placeholder.
 */
function toLlmTools(allowedTools: string[]) {
  return listTools(allowedTools).map((tool) => {
    let parameters: Record<string, unknown>;
    try {
      parameters = z.toJSONSchema(tool.inputSchema) as Record<string, unknown>;
    } catch {
      parameters = { type: 'object', properties: {}, additionalProperties: true };
    }

    return {
      name: tool.id,
      description: tool.description,
      parameters,
    };
  });
}

export async function generateResponseNode(
  state: TutorAgentState,
  config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  const runtime = getGraphRuntimeConfig(config);
  const messages = buildMessages(state);
  const systemPrompt = buildTutorSystemPrompt({
    locale: state.locale,
    basePrompt: state.systemPrompt,
    retrievedChunks: state.retrievedChunks,
    personalization: state.personalization,
  });
  const inputTokens = FALLBACK_estimateTokensFromChars(
    `${systemPrompt}\n${messages.map((message) => message.content).join('\n')}`,
  );

  const allowedTools = runtime.allowedTools ?? [];
  // SSE tutor runs stream tokens to the client — use streamAnswer there.
  // Tool calling via complete() is only for non-streaming agent runs.
  const useToolComplete =
    !runtime.onToken &&
    allowedTools.length > 0 &&
    Boolean(runtime.llmPort.complete);

  if (useToolComplete && runtime.llmPort.complete) {
    const response = await runtime.llmPort.complete({
      systemPrompt,
      messages,
      temperature: runtime.temperature,
      maxTokens: runtime.maxTokens,
      model: runtime.model,
      tools: toLlmTools(allowedTools),
    });

    if (response.toolCalls && response.toolCalls.length > 0) {
      const usageEstimated = !response.usage;
      return {
        pendingToolCalls: response.toolCalls,
        tokensUsed: {
          input: response.usage?.input ?? inputTokens,
          output: response.usage?.output ?? FALLBACK_estimateTokensFromChars(response.content),
        },
        ...(usageEstimated
          ? { runSignals: { ...state.runSignals, tokenUsageEstimated: true } }
          : {}),
      };
    }

    const finalResponse = response.content;
    const usageEstimated = !response.usage;
    return {
      finalResponse,
      pendingToolCalls: [],
      tokensUsed: {
        input: response.usage?.input ?? inputTokens,
        output: response.usage?.output ?? FALLBACK_estimateTokensFromChars(finalResponse),
      },
      ...(usageEstimated
        ? { runSignals: { ...state.runSignals, tokenUsageEstimated: true } }
        : {}),
    };
  }

  let finalResponse = '';
  let measuredUsage: { input: number; output: number } | undefined;

  for await (const token of runtime.llmPort.streamAnswer({
    systemPrompt,
    messages,
    temperature: runtime.temperature,
    maxTokens: runtime.maxTokens,
    model: runtime.model,
    signal: config.signal,
    onUsage: (usage) => {
      measuredUsage = usage;
    },
  })) {
    finalResponse += token;
    if (runtime.onToken) {
      await runtime.onToken(token);
    }
  }

  return {
    finalResponse,
    pendingToolCalls: [],
    tokensUsed: measuredUsage ?? {
      input: inputTokens,
      output: FALLBACK_estimateTokensFromChars(finalResponse),
    },
    ...(!measuredUsage
      ? { runSignals: { ...state.runSignals, tokenUsageEstimated: true } }
      : {}),
  };
}
