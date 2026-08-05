import { prisma } from '@/lib/prisma';

import type {
  KnowledgeSourceHashRecord,
  KnowledgeSourceHashRepositoryPort,
} from '../../domain/ports/KnowledgeSourceHashRepositoryPort';

function mapRecord(row: {
  sourceId: string;
  courseId: string;
  lectureId: string | null;
  contentHash: string;
  updatedAt: Date;
}): KnowledgeSourceHashRecord {
  return {
    sourceId: row.sourceId,
    courseId: row.courseId,
    lectureId: row.lectureId ?? undefined,
    contentHash: row.contentHash,
    updatedAt: row.updatedAt,
  };
}

export class PrismaKnowledgeSourceHashRepository
  implements KnowledgeSourceHashRepositoryPort
{
  async findBySourceId(sourceId: string): Promise<KnowledgeSourceHashRecord | null> {
    const row = await prisma.knowledgeSourceHash.findUnique({
      where: { sourceId },
    });

    return row ? mapRecord(row) : null;
  }

  async findByCourseId(courseId: string): Promise<KnowledgeSourceHashRecord[]> {
    const rows = await prisma.knowledgeSourceHash.findMany({
      where: { courseId },
    });

    return rows.map(mapRecord);
  }

  async findByLectureId(lectureId: string): Promise<KnowledgeSourceHashRecord[]> {
    const rows = await prisma.knowledgeSourceHash.findMany({
      where: { lectureId },
    });

    return rows.map(mapRecord);
  }

  async upsert(
    record: Omit<KnowledgeSourceHashRecord, 'updatedAt'>,
  ): Promise<void> {
    await prisma.knowledgeSourceHash.upsert({
      where: { sourceId: record.sourceId },
      create: {
        sourceId: record.sourceId,
        courseId: record.courseId,
        lectureId: record.lectureId ?? null,
        contentHash: record.contentHash,
      },
      update: {
        contentHash: record.contentHash,
        lectureId: record.lectureId ?? null,
      },
    });
  }

  async deleteBySourceIds(sourceIds: string[]): Promise<number> {
    if (sourceIds.length === 0) {
      return 0;
    }

    const result = await prisma.knowledgeSourceHash.deleteMany({
      where: { sourceId: { in: sourceIds } },
    });

    return result.count;
  }

  async deleteByCourseId(courseId: string): Promise<number> {
    const result = await prisma.knowledgeSourceHash.deleteMany({
      where: { courseId },
    });

    return result.count;
  }

  async deleteByLectureId(lectureId: string): Promise<number> {
    const result = await prisma.knowledgeSourceHash.deleteMany({
      where: { lectureId },
    });

    return result.count;
  }
}

export const prismaKnowledgeSourceHashRepository =
  new PrismaKnowledgeSourceHashRepository();
