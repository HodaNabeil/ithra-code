export type RetrievedContentChunk = {
  id: string;
  title: string;
  content: string;
  score: number;
  lectureId?: string;
  contentType: string;
  metadata?: Record<string, unknown>;
};

export type RetrievalStrategy =
  | 'strict'
  | 'expanded'
  | 'lecture-relaxed'
  | 'none';

export type ContentRetrievalResult = {
  chunks: RetrievedContentChunk[];
  hasResults: boolean;
  usedFallback: boolean;
  retrievalStrategy: RetrievalStrategy;
  embeddingTokensUsed: number;
};
