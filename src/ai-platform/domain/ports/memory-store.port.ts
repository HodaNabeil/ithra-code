export type MemoryFactType = 'preference' | 'misconception' | 'achievement' | 'note';

export type MemoryScopeType = 'session' | 'conversation' | 'course' | 'global' | 'lecture';

export interface MemoryScope {
  type: MemoryScopeType;
  userId: string;
  courseId?: string;
  lectureId?: string;
  threadId?: string;
}

export interface MemoryFact {
  id?: string;
  userId: string;
  agentId?: string;
  scopeType: MemoryScopeType;
  scopeId?: string;
  factType: MemoryFactType;
  content: string;
  confidence: number;
  sourceRunId?: string;
  expiresAt?: Date;
}

export interface MemoryQuery {
  userId: string;
  agentId?: string;
  scopeType?: MemoryScopeType;
  scopeId?: string;
  factTypes?: MemoryFactType[];
  limit?: number;
}

export interface MemoryStorePort {
  storeFact(fact: MemoryFact): Promise<MemoryFact>;
  getFacts(query: MemoryQuery): Promise<MemoryFact[]>;
  deleteFacts(userId: string, scope?: Pick<MemoryScope, 'type' | 'courseId' | 'lectureId'>): Promise<number>;
}
