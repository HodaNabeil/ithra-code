import type { IndexedKnowledgeChunk } from '../models/KnowledgeChunk';

export type ReplaceSourceChunksParams = {
  sourceId: string;
  courseId: string;
  lectureId?: string;
  contentHash: string;
  chunks: IndexedKnowledgeChunk[];
};

export interface KnowledgeChunkRepositoryPort {
  deleteByCourseId(courseId: string): Promise<number>;
  deleteByLectureId(lectureId: string): Promise<number>;
  deleteBySourceId(sourceId: string): Promise<number>;
  deleteBySourceIds(sourceIds: string[]): Promise<number>;
  countByCourseId(courseId: string): Promise<number>;
  insertMany(chunks: IndexedKnowledgeChunk[]): Promise<void>;
  replaceSourceChunks(params: ReplaceSourceChunksParams): Promise<void>;
  markCourseIndexed(courseId: string): Promise<void>;
}
