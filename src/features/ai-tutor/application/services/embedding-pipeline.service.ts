import type { EmbeddingPort } from '../../domain/ports/EmbeddingPort';
import { EmbeddingError } from '../../domain/ports/EmbeddingPort';
import { IndexingError, IndexingErrorCodes } from '../errors/indexing.errors';
import type {
  IndexedKnowledgeChunk,
  KnowledgeChunkRecord,
} from '../../domain/models/KnowledgeChunk';
import { AI_TUTOR_CONSTANTS } from '../../shared';

export async function embedChunkRecords(
  records: KnowledgeChunkRecord[],
  embeddingPort: EmbeddingPort,
): Promise<IndexedKnowledgeChunk[]> {
  if (records.length === 0) {
    return [];
  }

  const indexed: IndexedKnowledgeChunk[] = [];
  const batchSize = AI_TUTOR_CONSTANTS.EMBEDDING_BATCH_SIZE;

  for (let start = 0; start < records.length; start += batchSize) {
    const batch = records.slice(start, start + batchSize);
    const texts = batch.map((record) => record.content);

    try {
      const result = await embeddingPort.generateBatchEmbeddings(texts);

      for (let index = 0; index < batch.length; index += 1) {
        const record = batch[index];
        const embedding = result.embeddings[index];

        if (!record || !embedding) {
          throw new IndexingError(
            502,
            'فشل مطابقة التضمينات مع المقاطع',
            IndexingErrorCodes.EMBEDDING_FAILED,
          );
        }

        if (embedding.embedding.length !== embeddingPort.getDimensions()) {
          throw new IndexingError(
            502,
            'أبعاد التضمين غير متوافقة مع الإعدادات',
            IndexingErrorCodes.EMBEDDING_FAILED,
          );
        }

        indexed.push({
          ...record,
          embedding: embedding.embedding,
        });
      }
    } catch (error) {
      if (error instanceof IndexingError) {
        throw error;
      }

      if (error instanceof EmbeddingError) {
        throw new IndexingError(502, error.message, IndexingErrorCodes.EMBEDDING_FAILED);
      }

      throw new IndexingError(
        502,
        'فشل توليد تضمينات المحتوى',
        IndexingErrorCodes.EMBEDDING_FAILED,
      );
    }
  }

  return indexed;
}
