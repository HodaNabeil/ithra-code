import { prisma } from '@/lib/prisma';

import type { IndexedKnowledgeChunk } from '../../domain/models/KnowledgeChunk';
import type {
  KnowledgeChunkRepositoryPort,
  ReplaceSourceChunksParams,
} from '../../domain/ports/KnowledgeChunkRepositoryPort';

const INSERT_BATCH_SIZE = 50;

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

async function insertChunkBatch(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  chunks: IndexedKnowledgeChunk[],
): Promise<void> {
  for (const chunk of chunks) {
    await tx.$executeRawUnsafe(
      `
        INSERT INTO knowledge_chunks (
          id,
          course_id,
          section_id,
          lecture_id,
          source_id,
          title,
          content,
          content_type,
          sensitivity,
          chunk_index,
          token_count,
          metadata,
          embedding,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8::"knowledge_content_type",
          $9::"knowledge_sensitivity",
          $10, $11, $12::jsonb, $13::vector, NOW(), NOW()
        )
      `,
      chunk.id,
      chunk.courseId,
      chunk.sectionId ?? null,
      chunk.lectureId ?? null,
      chunk.sourceId,
      chunk.title,
      chunk.content,
      chunk.contentType,
      chunk.sensitivity,
      chunk.chunkIndex,
      chunk.tokenCount ?? null,
      chunk.metadata ? JSON.stringify(chunk.metadata) : null,
      toVectorLiteral(chunk.embedding),
    );
  }
}

export class PrismaKnowledgeChunkRepository implements KnowledgeChunkRepositoryPort {
  async deleteByCourseId(courseId: string): Promise<number> {
    const result = await prisma.knowledgeChunk.deleteMany({
      where: { courseId },
    });

    return result.count;
  }

  async deleteByLectureId(lectureId: string): Promise<number> {
    const result = await prisma.knowledgeChunk.deleteMany({
      where: { lectureId },
    });

    return result.count;
  }

  async deleteBySourceId(sourceId: string): Promise<number> {
    const result = await prisma.knowledgeChunk.deleteMany({
      where: { sourceId },
    });

    return result.count;
  }

  async deleteBySourceIds(sourceIds: string[]): Promise<number> {
    if (sourceIds.length === 0) {
      return 0;
    }

    const result = await prisma.knowledgeChunk.deleteMany({
      where: { sourceId: { in: sourceIds } },
    });

    return result.count;
  }

  async countByCourseId(courseId: string): Promise<number> {
    return prisma.knowledgeChunk.count({
      where: { courseId },
    });
  }

  async insertMany(chunks: IndexedKnowledgeChunk[]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (let index = 0; index < chunks.length; index += INSERT_BATCH_SIZE) {
        const batch = chunks.slice(index, index + INSERT_BATCH_SIZE);
        await insertChunkBatch(tx, batch);
      }
    });
  }

  async replaceSourceChunks(params: ReplaceSourceChunksParams): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.knowledgeChunk.deleteMany({
        where: { sourceId: params.sourceId },
      });

      for (let index = 0; index < params.chunks.length; index += INSERT_BATCH_SIZE) {
        const batch = params.chunks.slice(index, index + INSERT_BATCH_SIZE);
        await insertChunkBatch(tx, batch);
      }

      await tx.knowledgeSourceHash.upsert({
        where: { sourceId: params.sourceId },
        create: {
          sourceId: params.sourceId,
          courseId: params.courseId,
          lectureId: params.lectureId ?? null,
          contentHash: params.contentHash,
        },
        update: {
          contentHash: params.contentHash,
          lectureId: params.lectureId ?? null,
        },
      });
    });
  }

  async markCourseIndexed(courseId: string): Promise<void> {
    await prisma.course.update({
      where: { id: courseId },
      data: { knowledgeIndexedAt: new Date() },
    });
  }
}

export const prismaKnowledgeChunkRepository = new PrismaKnowledgeChunkRepository();
