import assert from 'node:assert/strict';

(process.env as Record<string, string | undefined>).NODE_ENV = 'test';
(process.env as Record<string, string | undefined>).SKIP_ENV_VALIDATION =
  'true';

import type {
  EmbeddingPort,
  EmbeddingResult,
} from '@/ai-platform/domain/ports/embedding.port';
import type { VectorSearchPort } from '@/ai-platform/domain/ports/vector-search.port';
import { retrieveRelevantContent } from '@/ai-platform/rag/retrieval/content-retriever.service';

class FakeEmbeddingPort implements EmbeddingPort {
  constructor(private readonly tokensUsed: number) {}

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    return {
      text,
      embedding: [0.1, 0.2],
      dimensions: 2,
      model: 'text-embedding-3-small',
      tokensUsed: this.tokensUsed,
    };
  }

  async generateBatchEmbeddings(texts: string[]) {
    const embeddings = await Promise.all(
      texts.map((text) => this.generateEmbedding(text)),
    );
    return {
      embeddings,
      totalTokensUsed: this.tokensUsed * texts.length,
    };
  }

  getDimensions(): number {
    return 2;
  }
}

const fakeVectorSearchPort = {
  async search() {
    return [
      {
        id: 'chunk-1',
        content: 'content',
        score: 0.9,
        metadata: { title: 'Lecture' },
      },
    ];
  },
} as unknown as VectorSearchPort;

async function main(): Promise<void> {
  const result = await retrieveRelevantContent(
    {
      question: 'What is a variable?',
      courseId: 'course-1',
    },
    {
      embeddingPort: new FakeEmbeddingPort(42),
      vectorSearchPort: fakeVectorSearchPort,
    },
  );

  assert.equal(result.embeddingTokensUsed, 42);

  console.log('[verify-embedding-token-capture] PASS');
}

main().catch((error) => {
  console.error('[verify-embedding-token-capture] FAIL', error);
  process.exit(1);
});
