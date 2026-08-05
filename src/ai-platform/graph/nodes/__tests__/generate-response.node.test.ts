import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { z } from 'zod';

import type {
  LlmCompleteOptions,
  LlmCompleteResult,
  LlmPort,
  LlmStreamOptions,
  LlmToolDefinition,
} from '../../../domain/ports/llm.port';
import {
  registerTool,
  resetToolRegistryForTests,
} from '../../../tools/registry/tool-registry';
import type { GraphRuntimeConfigurable } from '../../runtime-config';
import type { TutorAgentState } from '../../state/tutor-agent.state';
import { generateResponseNode } from '../generate-response.node';

function capturingLlmPort(): { port: LlmPort; captured: LlmStreamOptions[] } {
  const captured: LlmStreamOptions[] = [];
  const port: LlmPort = {
    streamAnswer(options: LlmStreamOptions) {
      captured.push(options);
      return (async function* () {
        yield 'hello';
      })();
    },
  };
  return { port, captured };
}

function baseState(overrides: Partial<TutorAgentState> = {}): TutorAgentState {
  return {
    agentId: 'tutor',
    userId: 'user-1',
    input: 'What are loops?',
    locale: 'en',
    systemPrompt: 'You are a smart tutor.',
    conversationHistory: [],
    retrievedChunks: [],
    sanitizedInput: 'What are loops?',
    assessmentBlocked: false,
    finalResponse: '',
    outputValid: false,
    validationErrors: [],
    tokensUsed: { input: 0, output: 0 },
    pendingToolCalls: [],
    toolResults: [],
    toolIterations: 0,
    ...overrides,
  };
}

function configWith(configurable: Partial<GraphRuntimeConfigurable>): LangGraphRunnableConfig {
  return { configurable } as unknown as LangGraphRunnableConfig;
}

describe('generate-response.node', () => {
  it('builds the system prompt from retrievedChunks', async () => {
    const { port, captured } = capturingLlmPort();

    await generateResponseNode(
      baseState({
        retrievedChunks: [
          { id: 'c1', content: 'A loop repeats a block of code.', score: 0.9, metadata: { title: 'Loops 101' } },
        ],
      }),
      configWith({ llmPort: port }),
    );

    assert.equal(captured.length, 1);
    assert.match(captured[0]!.systemPrompt, /Loops 101/);
    assert.match(captured[0]!.systemPrompt, /A loop repeats a block of code\./);
    assert.match(captured[0]!.systemPrompt, /Relevant course material/);
  });

  it('uses the RAG fallback prompt when there are no retrieved chunks', async () => {
    const { port, captured } = capturingLlmPort();

    await generateResponseNode(baseState(), configWith({ llmPort: port }));

    assert.equal(captured.length, 1);
    assert.doesNotMatch(captured[0]!.systemPrompt, /Relevant course material/);
  });

  it('includes personalization facts in the system prompt', async () => {
    const { port, captured } = capturingLlmPort();

    await generateResponseNode(
      baseState({
        personalization: {
          studentName: 'Sara',
          learningLevel: 'Intermediate',
          courseTitle: 'Intro to JS',
        },
      }),
      configWith({ llmPort: port }),
    );

    assert.match(captured[0]!.systemPrompt, /Sara/);
    assert.match(captured[0]!.systemPrompt, /Intro to JS/);
  });

  describe('tool JSON schema generation', () => {
    beforeEach(() => {
      resetToolRegistryForTests();
    });

    it('sends real Zod-derived JSON Schema for tool parameters instead of an empty placeholder', async () => {
      registerTool(
        {
          id: 'calculator',
          name: 'Calculator',
          description: 'Evaluates a math expression',
          source: 'builtin',
          inputSchema: z.object({ expression: z.string().min(1) }),
          outputSchema: z.object({ result: z.number() }),
          timeout: 1000,
          requiresAuth: false,
        },
        async () => ({ result: 0 }),
      );

      let capturedTools: LlmToolDefinition[] | undefined;
      const port: LlmPort = {
        streamAnswer: (async function* () {})() as never,
        async complete(options: LlmCompleteOptions): Promise<LlmCompleteResult> {
          capturedTools = options.tools;
          return { content: 'ok' };
        },
      };

      await generateResponseNode(
        baseState(),
        configWith({ llmPort: port, allowedTools: ['calculator'] }),
      );

      assert.ok(capturedTools);
      const calculatorTool = capturedTools!.find((tool) => tool.name === 'calculator');
      assert.ok(calculatorTool);
      const parameters = calculatorTool!.parameters as {
        type: string;
        properties: Record<string, unknown>;
        required?: string[];
      };
      assert.equal(parameters.type, 'object');
      assert.ok(parameters.properties.expression);
      assert.ok(parameters.required?.includes('expression'));
    });

    it('prefers streamAnswer over complete when streaming tokens to the client', async () => {
      const captured: LlmStreamOptions[] = [];
      let completeCalled = false;
      const port: LlmPort = {
        streamAnswer(options: LlmStreamOptions) {
          captured.push(options);
          return (async function* () {
            yield 'streamed';
          })();
        },
        async complete(): Promise<LlmCompleteResult> {
          completeCalled = true;
          return { content: 'complete' };
        },
      };

      await generateResponseNode(
        baseState(),
        configWith({
          llmPort: port,
          allowedTools: ['calculator'],
          onToken: async () => undefined,
        }),
      );

      assert.equal(completeCalled, false);
      assert.equal(captured.length, 1);
      assert.equal(captured[0]?.tools, undefined);
    });
  });
});
