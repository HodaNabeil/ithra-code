export type KnowledgeSourceHashRecord = {
  sourceId: string;
  courseId: string;
  lectureId?: string;
  contentHash: string;
  updatedAt: Date;
};

export interface KnowledgeSourceHashRepositoryPort {
  findBySourceId(sourceId: string): Promise<KnowledgeSourceHashRecord | null>;
  findByCourseId(courseId: string): Promise<KnowledgeSourceHashRecord[]>;
  findByLectureId(lectureId: string): Promise<KnowledgeSourceHashRecord[]>;
  upsert(record: Omit<KnowledgeSourceHashRecord, 'updatedAt'>): Promise<void>;
  deleteBySourceIds(sourceIds: string[]): Promise<number>;
  deleteByCourseId(courseId: string): Promise<number>;
  deleteByLectureId(lectureId: string): Promise<number>;
}
