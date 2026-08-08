import type {
  KnowledgeContentType,
  KnowledgeSensitivity,
} from '@/generated/prisma/enums';

export type KnowledgeChunkRecord = {
  id: string;
  courseId: string;
  sectionId?: string;
  lectureId?: string;
  sourceId: string;
  title: string;
  content: string;
  contentType: KnowledgeContentType;
  sensitivity: KnowledgeSensitivity;
  chunkIndex: number;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
  embedding?: number[];
};

export type IndexedKnowledgeChunk = KnowledgeChunkRecord & {
  embedding: number[];
};
