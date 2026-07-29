import type { IndexedKnowledgeChunk } from '../models/KnowledgeChunk';

export interface KnowledgeChunkRepositoryPort {
  deleteByCourseId(courseId: string): Promise<number>;
  deleteByLectureId(lectureId: string): Promise<number>;
  countByCourseId(courseId: string): Promise<number>;
  insertMany(chunks: IndexedKnowledgeChunk[]): Promise<void>;
  markCourseIndexed(courseId: string): Promise<void>;
}
