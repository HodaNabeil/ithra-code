import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { retrieveRelevantContent } from '@/features/ai-tutor/application/services/content-retriever.service';
import type {
  EmbeddingPort,
  EmbeddingResult,
} from '@/features/ai-tutor/domain/ports/EmbeddingPort';
import type { VectorSearchPort } from '@/features/ai-tutor/domain/ports/VectorSearchPort';

function createEmbeddingPort(embedding: number[] = [0.1, 0.2, 0.3]): EmbeddingPort {
  return {
    generateEmbedding: async (text): Promise<EmbeddingResult> => ({
      text,
      embedding,
      model: 'test-embedding',
      dimensions: embedding.length,
    }),
    generateBatchEmbeddings: async (texts: string[]) => ({
      embeddings: texts.map((text, index) => ({
        text,
        embedding: [index, index + 1],
        model: 'test-embedding',
        dimensions: 2,
      })),
      totalTokensUsed: texts.length,
    }),
    getDimensions: () => embedding.length,
  };
}

function createVectorSearchPort(
  results: Awaited<ReturnType<VectorSearchPort['search']>>,
): VectorSearchPort {
  return {
    search: async () => results,
    index: async (id) => id,
    indexBatch: async (items) => items.length,
    delete: async () => true,
    update: async () => undefined,
    clear: async () => 0,
    getStats: async () => ({
      totalVectors: 0,
      indexSize: 0,
      lastUpdated: new Date(0),
    }),
  };
}

describe('content-retriever.service', () => {
  it('returns empty result for blank questions', async () => {
    const result = await retrieveRelevantContent(
      {
        question: '   ',
        courseId: 'course-1',
      },
      {
        embeddingPort: createEmbeddingPort(),
        vectorSearchPort: createVectorSearchPort([]),
      },
    );

    assert.equal(result.hasResults, false);
    assert.equal(result.usedFallback, true);
    assert.equal(result.chunks.length, 0);
  });

  it('returns ranked chunks when vector search finds matches', async () => {
    const result = await retrieveRelevantContent(
      {
        question: 'What is React Context?',
        courseId: 'course-1',
        lectureId: 'lecture-1',
      },
      {
        embeddingPort: createEmbeddingPort(),
        vectorSearchPort: createVectorSearchPort([
          {
            id: 'chunk-1',
            content: 'Context shares data without prop drilling',
            score: 0.92,
            metadata: {
              title: 'React Context',
              lectureId: 'lecture-1',
              contentType: 'LECTURE_CONTENT',
            },
          },
        ]),
      },
    );

    assert.equal(result.hasResults, true);
    assert.equal(result.usedFallback, false);
    assert.equal(result.chunks.length, 1);
    assert.equal(result.chunks[0]?.title, 'React Context');
    assert.equal(result.chunks[0]?.score, 0.92);
  });

  it('marks fallback when vector search returns no matches', async () => {
    const result = await retrieveRelevantContent(
      {
        question: 'Explain quantum computing',
        courseId: 'course-1',
      },
      {
        embeddingPort: createEmbeddingPort(),
        vectorSearchPort: createVectorSearchPort([]),
      },
    );

    assert.equal(result.hasResults, false);
    assert.equal(result.usedFallback, true);
  });

  it('retries follow-up questions with expanded context before falling back', async () => {
    const searchCalls: Array<{ query: string; minScore: number }> = [];
    const embeddingPort: EmbeddingPort = {
      generateEmbedding: async (text) => {
        searchCalls.push({
          query: text,
          minScore: -1,
        });
        return {
          text,
          embedding: [0.1, 0.2, 0.3],
          model: 'test-embedding',
          dimensions: 3,
        };
      },
      generateBatchEmbeddings: async (texts) => ({
        embeddings: texts.map((text) => ({
          text,
          embedding: [0.1, 0.2, 0.3],
          model: 'test-embedding',
          dimensions: 3,
        })),
        totalTokensUsed: texts.length,
      }),
      getDimensions: () => 3,
    };

    let callCount = 0;
    const vectorSearchPort: VectorSearchPort = {
      search: async () => {
        callCount += 1;
        if (callCount === 1) {
          return [];
        }

        return [
          {
            id: 'chunk-1',
            content: 'الدورة تغطي EC2 و S3 و Lambda',
            score: 0.31,
            metadata: {
              title: 'مقدمة عامة — الوصف',
              lectureId: 'lecture-1',
              contentType: 'LECTURE_DESCRIPTION',
            },
          },
        ];
      },
      index: async (id) => id,
      indexBatch: async (items) => items.length,
      delete: async () => true,
      update: async () => undefined,
      clear: async () => 0,
      getStats: async () => ({
        totalVectors: 0,
        indexSize: 0,
        lastUpdated: new Date(0),
      }),
    };

    const result = await retrieveRelevantContent(
      {
        question: 'اي المفاهيم اللي قالها',
        courseId: 'course-1',
        lectureId: 'lecture-1',
        lectureTitle: 'مقدمة عامة',
        courseTitle: 'AWS for Developers',
        recentHistory: [
          { role: 'user', content: 'الدرس بيتكلم عن اي' },
          {
            role: 'assistant',
            content:
              'المحاضرة الحالية مقدمة عامة وهي فيديو تعريفي عن محتوى الدورة.',
          },
        ],
      },
      {
        embeddingPort,
        vectorSearchPort,
      },
    );

    assert.equal(result.hasResults, true);
    assert.equal(result.usedFallback, false);
    assert.equal(result.chunks[0]?.title, 'مقدمة عامة — الوصف');
    assert.equal(callCount, 2);
    assert.match(searchCalls[1]?.query ?? '', /سؤال متابعة: اي المفاهيم اللي قالها/);
  });

  it('falls back to lecture chunks when follow-up retrieval still misses', async () => {
    let callCount = 0;
    const vectorSearchPort: VectorSearchPort = {
      search: async (_embedding, options) => {
        callCount += 1;
        if ((options?.minScore ?? 1) > 0) {
          return [];
        }

        return [
          {
            id: 'chunk-1',
            content: 'فيديو تعريفي يشرح أهداف الدورة',
            score: 0.12,
            metadata: {
              title: 'مقدمة عامة — الوصف',
              lectureId: 'lecture-1',
              contentType: 'LECTURE_DESCRIPTION',
            },
          },
        ];
      },
      index: async (id) => id,
      indexBatch: async (items) => items.length,
      delete: async () => true,
      update: async () => undefined,
      clear: async () => 0,
      getStats: async () => ({
        totalVectors: 0,
        indexSize: 0,
        lastUpdated: new Date(0),
      }),
    };

    const result = await retrieveRelevantContent(
      {
        question: 'اي المفاهيم اللي قالها',
        courseId: 'course-1',
        lectureId: 'lecture-1',
        lectureTitle: 'مقدمة عامة',
        recentHistory: [{ role: 'user', content: 'الدرس بيتكلم عن اي' }],
      },
      {
        embeddingPort: createEmbeddingPort(),
        vectorSearchPort,
      },
    );

    assert.equal(result.hasResults, true);
    assert.equal(result.usedFallback, false);
    assert.equal(callCount, 3);
  });
});
