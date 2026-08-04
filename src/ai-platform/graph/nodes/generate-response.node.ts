import type { LangGraphRunnableConfig } from '@langchain/langgraph';

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

function toLlmTools(allowedTools: string[]) {
  return listTools(allowedTools).map((tool) => ({
    name: tool.id,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: true,
    },
  }));
}

export async function generateResponseNode(
  state: TutorAgentState,
  config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  const runtime = getGraphRuntimeConfig(config);
  const messages = buildMessages(state);
  const inputTokens = estimateTokens(
    `${state.systemPrompt}\n${messages.map((message) => message.content).join('\n')}`,
  );

  const allowedTools = runtime.allowedTools ?? [];
  const useTools = allowedTools.length > 0 && runtime.llmPort.complete;

  if (useTools && runtime.llmPort.complete) {
    const response = await runtime.llmPort.complete({
      systemPrompt: state.systemPrompt,
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
    systemPrompt: state.systemPrompt,
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
