import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import {
  registerAgent,
  resetAgentRegistryForTests,
} from '@/ai-platform/agents/definitions/agent-registry';
import { tutorAgentDefinition } from '@/ai-platform/agents/tutor/tutor-agent.definition';
import { buildAgentContext } from '@/ai-platform/application/runtime/context-builder';
import type { EmbeddingPort } from '@/ai-platform/domain/ports/embedding.port';
import type { LlmPort, LlmStreamOptions } from '@/ai-platform/domain/ports/llm.port';
import type { VectorSearchPort } from '@/ai-platform/domain/ports/vector-search.port';
import {
  compileAgentGraph,
  resetCompiledGraphsForTests,
} from '@/ai-platform/graph/compiler/graph-compiler';
import type { TutorAgentState } from '@/ai-platform/graph/state/tutor-agent.state';
import type { GraphRuntimeConfigurable } from '@/ai-platform/graph/runtime-config';

describe('agent runtime — tutor stream', () => {
  it('exposes tutor guard configuration on agent definition', () => {
    assert.equal(tutorAgentDefinition.id, 'tutor');
    assert.equal(tutorAgentDefinition.graphId, 'tutor-graph');
    assert.equal(tutorAgentDefinition.retrievalMode, 'eager');
    assert.equal(tutorAgentDefinition.guards.rateLimitPerMinute, 10);
    assert.equal(tutorAgentDefinition.guards.maxConcurrentStreams, 3);
    assert.deepEqual(tutorAgentDefinition.allowedTools, ['search', 'calculator']);
  });
});

describe('agent runtime — tutor graph end-to-end RAG', () => {
  beforeEach(() => {
    resetAgentRegistryForTests();
    resetCompiledGraphsForTests();
    registerAgent(tutorAgentDefinition);
  });

  it('runs retrieve-context then generate-response with real RAG chunks in the prompt', async () => {
    const captured: LlmStreamOptions[] = [];
    const llmPort: LlmPort = {
      streamAnswer(options: LlmStreamOptions) {
        captured.push(options);
        return (async function* () {
          yield 'Loops repeat code blocks.';
        })();
      },
    };

    const embeddingPort: EmbeddingPort = {
      async generateEmbedding(text: string) {
        return { text, embedding: [0.1, 0.2], dimensions: 2, model: 'fake' };
      },
      async generateBatchEmbeddings(texts: string[]) {
        return {
          embeddings: texts.map((text) => ({
            text,
            embedding: [0.1, 0.2],
            dimensions: 2,
            model: 'fake',
          })),
          totalTokensUsed: 0,
        };
      },
      getDimensions() {
        return 2;
      },
    };

    const vectorSearchPort: VectorSearchPort = {
      async search() {
        return [
          {
            id: 'chunk-1',
            content: 'A for-loop repeats a block of code a fixed number of times.',
            score: 0.95,
            metadata: { title: 'Loops in JavaScript', contentType: 'LECTURE' },
          },
        ];
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

    const graph = compileAgentGraph('tutor');
    const built = buildAgentContext(tutorAgentDefinition, {
      userId: 'user-1',
      input: 'What are loops?',
      locale: 'en',
      scope: { userId: 'user-1', courseId: 'course-1' },
    });

    const configurable: GraphRuntimeConfigurable = {
      llmPort,
      embeddingPort,
      vectorSearchPort,
      courseId: 'course-1',
      allowedTools: [],
    };

    const finalState = (await graph.invoke(built.initialState as never, {
      configurable,
    } as LangGraphRunnableConfig)) as unknown as TutorAgentState;

    assert.equal(finalState.retrievedChunks.length, 1);
    assert.equal(finalState.retrievedChunks[0]?.id, 'chunk-1');
    assert.equal(finalState.finalResponse, 'Loops repeat code blocks.');
    assert.equal(captured.length, 1);
    assert.match(captured[0]!.systemPrompt, /Loops in JavaScript/);
    assert.match(
      captured[0]!.systemPrompt,
      /A for-loop repeats a block of code a fixed number of times\./,
    );
  });
});
