import { prisma } from '@/lib/prisma';
import { KnowledgeSensitivity } from '@/generated/prisma/enums';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  VectorSearchError,
  VectorSearchErrorCodes,
  type SearchResult,
  type VectorSearchOptions,
  type VectorSearchPort,
} from '../../domain/ports/vector-search.port';
import { withSpan } from '../../observability/opentelemetry/span-helpers';

type VectorSearchRow = {
  id: string;
  title: string;
  content: string;
  lecture_id: string | null;
  section_id: string | null;
  content_type: string;
  metadata: Record<string, unknown> | null;
  score: number;
};

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

function mapRow(row: VectorSearchRow): SearchResult {
  return {
    id: row.id,
    content: row.content,
    score: Number(row.score),
    metadata: {
      title: row.title,
      lectureId: row.lecture_id ?? undefined,
      sectionId: row.section_id ?? undefined,
      contentType: row.content_type,
      ...(row.metadata ?? {}),
    },
  };
}

export class PostgresVectorSearchAdapter implements VectorSearchPort {
  async search(embedding: number[], options?: VectorSearchOptions): Promise<SearchResult[]> {
    return withSpan(
      'ai.vector.search',
      {
        'ai.vector.top_k': options?.topK ?? AIPlatformConfig.getRetrievalConfig().topK,
      },
      async () => this.searchInner(embedding, options),
    );
  }

  private async searchInner(
    embedding: number[],
    options?: VectorSearchOptions,
  ): Promise<SearchResult[]> {
    const courseId = options?.filter?.courseId;
    if (!courseId || typeof courseId !== 'string') {
      throw new VectorSearchError(
        VectorSearchErrorCodes.INVALID_EMBEDDING,
        'معرف الدورة مطلوب للبحث',
        false,
      );
    }

    if (embedding.length !== AIPlatformConfig.getEmbeddingConfig().dimensions) {
      throw new VectorSearchError(
        VectorSearchErrorCodes.INVALID_EMBEDDING,
        'أبعاد متجه البحث غير صالحة',
        false,
      );
    }

    const config = AIPlatformConfig.getRetrievalConfig();
    const topK = options?.topK ?? config.topK;
    const minScore = options?.minScore ?? config.minSimilarity;
    const lectureId =
      typeof options?.filter?.lectureId === 'string' ? options.filter.lectureId : undefined;
    const lectureOnly =
      options?.filter?.lectureOnly === true &&
      typeof lectureId === 'string' &&
      lectureId.length > 0;

    try {
      const vectorLiteral = toVectorLiteral(embedding);
      const rows = lectureOnly
        ? await prisma.$queryRawUnsafe<VectorSearchRow[]>(
            `
              SELECT
                id,
                title,
                content,
                lecture_id,
                section_id,
                content_type::text AS content_type,
                metadata,
                (1 - (embedding <=> $1::vector))::float8 AS score
              FROM knowledge_chunks
              WHERE course_id = $2
                AND sensitivity = $3::"knowledge_sensitivity"
                AND embedding IS NOT NULL
                AND lecture_id = $4
                AND (1 - (embedding <=> $1::vector)) >= $6
              ORDER BY embedding <=> $1::vector
              LIMIT $5
            `,
            vectorLiteral,
            courseId,
            KnowledgeSensitivity.PUBLIC,
            lectureId,
            topK,
            minScore,
          )
        : lectureId
        ? await prisma.$queryRawUnsafe<VectorSearchRow[]>(
            `
              SELECT
                id,
                title,
                content,
                lecture_id,
                section_id,
                content_type::text AS content_type,
                metadata,
                (1 - (embedding <=> $1::vector))::float8 AS score
              FROM knowledge_chunks
              WHERE course_id = $2
                AND sensitivity = $3::"knowledge_sensitivity"
                AND embedding IS NOT NULL
                AND (1 - (embedding <=> $1::vector)) >= $6
              ORDER BY
                CASE WHEN lecture_id = $4 THEN 0 ELSE 1 END,
                embedding <=> $1::vector
              LIMIT $5
            `,
            vectorLiteral,
            courseId,
            KnowledgeSensitivity.PUBLIC,
            lectureId,
            topK,
            minScore,
          )
        : await prisma.$queryRawUnsafe<VectorSearchRow[]>(
            `
              SELECT
                id,
                title,
                content,
                lecture_id,
                section_id,
                content_type::text AS content_type,
                metadata,
                (1 - (embedding <=> $1::vector))::float8 AS score
              FROM knowledge_chunks
              WHERE course_id = $2
                AND sensitivity = $3::"knowledge_sensitivity"
                AND embedding IS NOT NULL
                AND (1 - (embedding <=> $1::vector)) >= $5
              ORDER BY embedding <=> $1::vector
              LIMIT $4
            `,
            vectorLiteral,
            courseId,
            KnowledgeSensitivity.PUBLIC,
            topK,
            minScore,
          );

      return rows.map(mapRow);
    } catch (error) {
      console.error('[VECTOR_SEARCH_ERROR]', error);
      throw new VectorSearchError(
        VectorSearchErrorCodes.QUERY_FAILED,
        'فشل البحث في قاعدة المعرفة',
        true,
      );
    }
  }

  async index(
    id: string,
    embedding: number[],
    metadata: Record<string, unknown>,
  ): Promise<string> {
    await this.update(id, embedding, metadata);
    return id;
  }

  async indexBatch(
    items: Array<{
      id: string;
      embedding: number[];
      metadata: Record<string, unknown>;
    }>,
  ): Promise<number> {
    if (items.length === 0) {
      return 0;
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const vectorLiteral = toVectorLiteral(item.embedding);
        await tx.$executeRawUnsafe(
          `UPDATE knowledge_chunks SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
          vectorLiteral,
          item.id,
        );

        if (item.metadata) {
          await tx.knowledgeChunk.update({
            where: { id: item.id },
            data: { metadata: item.metadata as object },
          });
        }
      }
    });

    return items.length;
  }

  async delete(id: string): Promise<boolean> {
    const result = await prisma.knowledgeChunk.deleteMany({
      where: { id },
    });

    return result.count > 0;
  }

  async update(
    id: string,
    embedding?: number[],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (embedding) {
      const vectorLiteral = toVectorLiteral(embedding);
      await prisma.$executeRawUnsafe(
        `UPDATE knowledge_chunks SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
        vectorLiteral,
        id,
      );
    }

    if (metadata) {
      await prisma.knowledgeChunk.update({
        where: { id },
        data: { metadata: metadata as object },
      });
    }
  }

  async clear(): Promise<number> {
    const result = await prisma.knowledgeChunk.deleteMany();
    return result.count;
  }

  async getStats(): Promise<{
    totalVectors: number;
    indexSize: number;
    lastUpdated: Date;
  }> {
    const [countRows, latestRows] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ count: number }>>(
        `SELECT COUNT(*)::int AS count FROM knowledge_chunks WHERE embedding IS NOT NULL`,
      ),
      prisma.$queryRawUnsafe<Array<{ updated_at: Date }>>(
        `SELECT updated_at FROM knowledge_chunks WHERE embedding IS NOT NULL ORDER BY updated_at DESC LIMIT 1`,
      ),
    ]);

    const totalVectors = countRows[0]?.count ?? 0;

    return {
      totalVectors,
      indexSize: totalVectors,
      lastUpdated: latestRows[0]?.updated_at ?? new Date(0),
    };
  }
}

export const postgresVectorSearchAdapter = new PostgresVectorSearchAdapter();
