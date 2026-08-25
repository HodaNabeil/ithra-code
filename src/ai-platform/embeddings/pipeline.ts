import type { EmbeddingPort } from '../domain/ports/embedding.port';
import { EmbeddingError } from '../domain/ports/embedding.port';
import {
  IndexingError,
  IndexingErrorCodes,
} from '../application/errors/indexing.error';
import { AI_PLATFORM_CONSTANTS } from '../shared/constants';
import { withSpan } from '../observability/opentelemetry/span-helpers';

export type EmbeddableRecord = {
  content: string;
};

export type IndexedRecord<T extends EmbeddableRecord> = T & {
  embedding: number[];
};

export async function embedRecords<T extends EmbeddableRecord>(
  records: T[],
  embeddingPort: EmbeddingPort,
): Promise<IndexedRecord<T>[]> {
  if (records.length === 0) {
    return [];
  }

  return withSpan(
    'ai.embedding.generate',
    { 'ai.embedding.count': records.length },
    async () => embedRecordsInner(records, embeddingPort),
  );
}

async function embedRecordsInner<T extends EmbeddableRecord>(
  records: T[],
  embeddingPort: EmbeddingPort,
): Promise<IndexedRecord<T>[]> {
  const indexed: IndexedRecord<T>[] = [];
  const batchSize = AI_PLATFORM_CONSTANTS.EMBEDDING_BATCH_SIZE;

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
        throw new IndexingError(
          502,
          error.message,
          IndexingErrorCodes.EMBEDDING_FAILED,
        );
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
