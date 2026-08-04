import type { EmbeddingPort } from '../../domain/ports/EmbeddingPort';
import { embedRecords } from '@/ai-platform/embeddings/pipeline';
import type {
  IndexedKnowledgeChunk,
  KnowledgeChunkRecord,
} from '../../domain/models/KnowledgeChunk';

export async function embedChunkRecords(
  records: KnowledgeChunkRecord[],
  embeddingPort: EmbeddingPort,
): Promise<IndexedKnowledgeChunk[]> {
  return embedRecords(records, embeddingPort);
}
