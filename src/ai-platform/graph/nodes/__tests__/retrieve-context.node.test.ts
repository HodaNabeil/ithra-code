import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { EmbeddingPort } from '../../../domain/ports/embedding.port';
import type { VectorSearchPort } from '../../../domain/ports/vector-search.port';
import type { GraphRuntimeConfigurable } from '../../runtime-config';
import type { TutorAgentState } from '../../state/tutor-agent.state';
import { retrieveContextNode } from '../retrieve-context.node';

function fakeEmbeddingPort(): EmbeddingPort {
  return {
    async generateEmbedding(text: string) {
      return { text, embedding: [0.1, 0.2, 0.3], dimensions: 3, model: 'fake' };
    },
    async generateBatchEmbeddings(texts: string[]) {
      return {
        embeddings: texts.map((text) => ({
          text,
          embedding: [0.1, 0.2, 0.3],
          dimensions: 3,
          model: 'fake',
        })),
        totalTokensUsed: 0,
      };
    },
    getDimensions() {
      return 3;
    },
  };
}

function fakeVectorSearchPort(
  results: Array<{ id: string; content: string; score: number; metadata: Record<string, unknown> }>,
): VectorSearchPort {
  return {
    async search() {
      return results;
    },
    async index() {
      return 'id';
    },
    async indexBatch() {
      return 0;
    },
    async delete() {
      return true;
    },
    async update() {},
    async clear() {
      return 0;
    },
    async getStats() {
      return { totalVectors: 0, indexSize: 0, lastUpdated: new Date() };
    },
  };
}

function baseState(overrides: Partial<TutorAgentState> = {}): TutorAgentState {
  return {
    agentId: 'tutor',
    userId: 'user-1',
    input: 'ما هي الحلقات؟',
    locale: 'ar',
    systemPrompt: 'system',
    conversationHistory: [],
    retrievedChunks: [],
    sanitizedInput: 'ما هي الحلقات؟',
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

describe('retrieve-context.node', () => {
  it('fetches chunks via EmbeddingPort + VectorSearchPort and stores them in state', async () => {
    const vectorSearchPort = fakeVectorSearchPort([
      {
        id: 'chunk-1',
        content: 'محتوى المحاضرة عن الحلقات',
        score: 0.92,
        metadata: { title: 'الحلقات في جافاسكريبت', contentType: 'LECTURE' },
      },
    ]);

    const result = await retrieveContextNode(
      baseState(),
      configWith({
        embeddingPort: fakeEmbeddingPort(),
        vectorSearchPort,
        courseId: 'course-1',
        lectureId: 'lecture-1',
      }),
    );

    assert.equal(result.retrievedChunks?.length, 1);
    assert.equal(result.retrievedChunks?.[0]?.id, 'chunk-1');
    assert.equal(result.retrievedChunks?.[0]?.metadata?.title, 'الحلقات في جافاسكريبت');
  });

  it('invokes onRetrieval callback with fetched chunks', async () => {
    const vectorSearchPort = fakeVectorSearchPort([
      { id: 'chunk-1', content: 'content', score: 0.5, metadata: {} },
    ]);

    let received: { chunks: unknown[]; usedFallback: boolean } | null = null;

    await retrieveContextNode(
      baseState(),
      configWith({
        embeddingPort: fakeEmbeddingPort(),
        vectorSearchPort,
        courseId: 'course-1',
        onRetrieval: async (chunks, usedFallback) => {
          received = { chunks, usedFallback };
        },
      }),
    );

    assert.ok(received);
    assert.equal((received as { chunks: unknown[] }).chunks.length, 1);
  });

  it('falls back to a pass-through when ports or courseId are missing', async () => {
    const result = await retrieveContextNode(
      baseState({ retrievedChunks: [{ id: 'existing', content: 'x', score: 1 }] }),
      configWith({}),
    );

    assert.equal(result.retrievedChunks?.length, 1);
    assert.equal(result.retrievedChunks?.[0]?.id, 'existing');
  });

  it('returns an empty array when the vector search finds no results', async () => {
    const vectorSearchPort = fakeVectorSearchPort([]);

    const result = await retrieveContextNode(
      baseState(),
      configWith({
        embeddingPort: fakeEmbeddingPort(),
        vectorSearchPort,
        courseId: 'course-1',
      }),
    );

    assert.deepEqual(result.retrievedChunks, []);
  });
});
