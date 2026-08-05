import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { z } from 'zod';

import { buildTutorSystemPrompt } from '../../prompts/tutor-system-prompt.builder';
import { listTools } from '../../tools/registry/tool-registry';
import type { TutorAgentState } from '../state/tutor-agent.state';
import { getGraphRuntimeConfig } from '../runtime-config';

function estimateTokens(text: string): number {
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
  const inputTokens = estimateTokens(
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
      tools: toLlmTools(allowedTools),
    });

    if (response.toolCalls && response.toolCalls.length > 0) {
      return {
        pendingToolCalls: response.toolCalls,
        tokensUsed: {
          input: inputTokens,
          output: estimateTokens(response.content),
        },
      };
    }

    const finalResponse = response.content;
    return {
      finalResponse,
      pendingToolCalls: [],
      tokensUsed: {
        input: inputTokens,
        output: estimateTokens(finalResponse),
      },
    };
  }

  let finalResponse = '';

  for await (const token of runtime.llmPort.streamAnswer({
    systemPrompt,
    messages,
    temperature: runtime.temperature,
    maxTokens: runtime.maxTokens,
  })) {
    finalResponse += token;
    if (runtime.onToken) {
      await runtime.onToken(token);
    }
  }

  return {
    finalResponse,
    pendingToolCalls: [],
    tokensUsed: {
      input: inputTokens,
      output: estimateTokens(finalResponse),
    },
  };
}
