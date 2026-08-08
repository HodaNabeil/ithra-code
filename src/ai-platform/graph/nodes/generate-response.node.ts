import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { z } from 'zod';

import {
  resolveTokenUsage,
  toGraphTokenUpdate,
} from '../../observability/usage';
import { buildTutorSystemPrompt } from '../../prompts/tutor-system-prompt.builder';
import { listTools } from '../../tools/registry/tool-registry';
import type { TutorAgentState } from '../state/tutor-agent.state';
import { getGraphRuntimeConfig } from '../runtime-config';

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

function resolveLlmUsage(params: {
  providerUsage?: { input: number; output: number } | null;
  systemPrompt: string;
  messages: ReturnType<typeof buildMessages>;
  outputText: string;
  model?: string;
}) {
  const inputText = `${params.systemPrompt}\n${params.messages.map((message) => message.content).join('\n')}`;
  const providerRaw = params.providerUsage
    ? {
        inputTokens: params.providerUsage.input,
        outputTokens: params.providerUsage.output,
      }
    : null;

  return resolveTokenUsage(providerRaw, {
    inputText,
    outputText: params.outputText,
    model: params.model,
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

  const allowedTools = runtime.allowedTools ?? [];
  // SSE tutor runs stream tokens to the client — use streamAnswer there.
  // Tool calling via complete() is only for non-streaming agent runs.
  const useToolComplete =
    !runtime.onToken &&
    allowedTools.length > 0 &&
    Boolean(runtime.llmPort.complete);

  if (useToolComplete && runtime.llmPort.complete) {
    let servedModel = runtime.model;
    const response = await runtime.llmPort.complete({
      systemPrompt,
      messages,
      temperature: runtime.temperature,
      maxTokens: runtime.maxTokens,
      model: runtime.model,
      tools: toLlmTools(allowedTools),
      onModelServed: (model) => {
        servedModel = model;
      },
    });

    if (response.toolCalls && response.toolCalls.length > 0) {
      const usage = resolveLlmUsage({
        providerUsage: response.usage,
        systemPrompt,
        messages,
        outputText: response.content,
        model: runtime.model,
      });

      return {
        pendingToolCalls: response.toolCalls,
        ...toGraphTokenUpdate(usage, servedModel),
      };
    }

    const usage = resolveLlmUsage({
      providerUsage: response.usage,
      systemPrompt,
      messages,
      outputText: response.content,
      model: runtime.model,
    });

    return {
      finalResponse: response.content,
      pendingToolCalls: [],
      ...toGraphTokenUpdate(usage, servedModel),
    };
  }

  let finalResponse = '';
  let measuredUsage: { input: number; output: number } | undefined;
  let servedModel = runtime.model;

  for await (const token of runtime.llmPort.streamAnswer({
    systemPrompt,
    messages,
    temperature: runtime.temperature,
    maxTokens: runtime.maxTokens,
    model: runtime.model,
    signal: config.signal,
    onModelServed: (model) => {
      servedModel = model;
    },
    onUsage: (usage) => {
      measuredUsage = usage;
    },
  })) {
    finalResponse += token;
    if (runtime.onToken) {
      await runtime.onToken(token);
    }
  }

  const usage = measuredUsage
    ? resolveLlmUsage({
        providerUsage: measuredUsage,
        systemPrompt,
        messages,
        outputText: finalResponse,
        model: runtime.model,
      })
    : resolveTokenUsage(null, {
        inputText: `${systemPrompt}\n${messages.map((message) => message.content).join('\n')}`,
        outputText: finalResponse,
        model: runtime.model,
      });

  return {
    finalResponse,
    pendingToolCalls: [],
    ...toGraphTokenUpdate(usage, servedModel),
  };
}
