import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { ConversationMemoryPort } from '../../../domain/ports/conversation-memory.port';
import type { GraphRuntimeConfigurable } from '../../runtime-config';
import type { TutorAgentState } from '../../state/tutor-agent.state';
import { loadHistoryNode } from '../load-history.node';

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
  return {
    configurable: {
      llmPort: { streamAnswer: async function* () {} },
      ...configurable,
    },
  } as unknown as LangGraphRunnableConfig;
}

function fakeMemoryPort(history: ConversationMemoryPort['getHistory']): ConversationMemoryPort {
  return {
    getHistory: history,
    appendTurn: async () => {},
    clear: async () => {},
  };
}

describe('load-history.node', () => {
  it('does nothing when conversationHistory was already supplied', async () => {
    let called = false;
    const port = fakeMemoryPort(async () => {
      called = true;
      return [{ role: 'user', content: 'previous' }];
    });

    const result = await loadHistoryNode(
      baseState({ conversationHistory: [{ role: 'user', content: 'already here' }] }),
      configWith({ threadId: 'thread-1', conversationMemoryPort: port }),
    );

    assert.deepEqual(result, {});
    assert.equal(called, false);
  });

  it('does nothing when there is no threadId', async () => {
    const port = fakeMemoryPort(async () => [{ role: 'user', content: 'previous' }]);

    const result = await loadHistoryNode(baseState(), configWith({ conversationMemoryPort: port }));

    assert.deepEqual(result, {});
  });

  it('does nothing when there is no conversationMemoryPort configured', async () => {
    const result = await loadHistoryNode(baseState(), configWith({ threadId: 'thread-1' }));

    assert.deepEqual(result, {});
  });

  it('loads history from the ConversationMemoryPort when history is empty', async () => {
    const port = fakeMemoryPort(async (threadId) => {
      assert.equal(threadId, 'thread-1');
      return [
        { role: 'user', content: 'earlier question' },
        { role: 'assistant', content: 'earlier answer' },
      ];
    });

    const result = await loadHistoryNode(
      baseState(),
      configWith({ threadId: 'thread-1', conversationMemoryPort: port }),
    );

    assert.equal(result.conversationHistory?.length, 2);
    assert.equal(result.conversationHistory?.[0]?.content, 'earlier question');
  });
});
