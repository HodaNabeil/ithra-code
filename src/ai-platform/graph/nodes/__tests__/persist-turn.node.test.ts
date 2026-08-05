import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { ConversationMemoryPort } from '../../../domain/ports/conversation-memory.port';
import type { GraphRuntimeConfigurable } from '../../runtime-config';
import type { TutorAgentState } from '../../state/tutor-agent.state';
import { persistTurnNode } from '../persist-turn.node';

function baseState(overrides: Partial<TutorAgentState> = {}): TutorAgentState {
  return {
    agentId: 'tutor',
    userId: 'user-1',
    input: 'What are loops?',
    locale: 'en',
    systemPrompt: 'system',
    conversationHistory: [],
    retrievedChunks: [],
    sanitizedInput: 'What are loops?',
    assessmentBlocked: false,
    finalResponse: 'A loop repeats a block of code.',
    outputValid: true,
    validationErrors: [],
    tokensUsed: { input: 0, output: 0 },
    pendingToolCalls: [],
    toolResults: [],
    toolIterations: 0,
    ...overrides,
  };
}

function configWith(configurable: Partial<GraphRuntimeConfigurable>): LangGraphRunnableConfig {
  return {
    configurable: {
      llmPort: { streamAnswer: async function* () {} },
      ...configurable,
    },
  } as unknown as LangGraphRunnableConfig;
}

function fakeMemoryPort(
  appendTurn: ConversationMemoryPort['appendTurn'],
): ConversationMemoryPort {
  return {
    getHistory: async () => [],
    appendTurn,
    clear: async () => {},
  };
}

describe('persist-turn.node', () => {
  it('appends the completed turn when threadId and port are configured', async () => {
    let captured: { threadId: string; userContent: string; assistantContent: string } | null =
      null;

    const port = fakeMemoryPort(async (threadId, turn) => {
      captured = { threadId, userContent: turn.userContent, assistantContent: turn.assistantContent };
    });

    await persistTurnNode(baseState(), configWith({ threadId: 'thread-1', conversationMemoryPort: port }));

    assert.ok(captured);
    const result = captured as {
      threadId: string;
      userContent: string;
      assistantContent: string;
    };
    assert.equal(result.threadId, 'thread-1');
    assert.equal(result.userContent, 'What are loops?');
    assert.equal(result.assistantContent, 'A loop repeats a block of code.');
  });

  it('does nothing when there is no threadId', async () => {
    let called = false;
    const port = fakeMemoryPort(async () => {
      called = true;
    });

    const result = await persistTurnNode(baseState(), configWith({ conversationMemoryPort: port }));

    assert.deepEqual(result, {});
    assert.equal(called, false);
  });

  it('does nothing when there is no conversationMemoryPort configured', async () => {
    const result = await persistTurnNode(baseState(), configWith({ threadId: 'thread-1' }));

    assert.deepEqual(result, {});
  });

  it('does nothing when there is no finalResponse yet', async () => {
    let called = false;
    const port = fakeMemoryPort(async () => {
      called = true;
    });

    const result = await persistTurnNode(
      baseState({ finalResponse: '' }),
      configWith({ threadId: 'thread-1', conversationMemoryPort: port }),
    );

    assert.deepEqual(result, {});
    assert.equal(called, false);
  });
});
