import { prisma } from '@/lib/prisma';

import type { IndexedKnowledgeChunk } from '../../domain/models/KnowledgeChunk';
import type { KnowledgeChunkRepositoryPort } from '../../domain/ports/KnowledgeChunkRepositoryPort';

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
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
