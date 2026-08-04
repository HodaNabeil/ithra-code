import type { EmbeddingPort } from '@/ai-platform/domain/ports/embedding.port';
import type { KnowledgeChunkRepositoryPort } from '@/ai-platform/indexing/domain/ports/KnowledgeChunkRepositoryPort';
import type { KnowledgeSourceHashRepositoryPort } from '@/ai-platform/indexing/domain/ports/KnowledgeSourceHashRepositoryPort';
import type { CourseForIndexingDTO } from '@/ai-platform/indexing/domain/ports/CourseContentRepositoryPort';
import type { KnowledgeSource } from '@/ai-platform/indexing/domain/models/KnowledgeSource';
import { isExtractionSkipped } from '@/ai-platform/indexing/domain/models/KnowledgeSource';
import { logger } from '@/lib/logger';

import { embedRecords } from '@/ai-platform/embeddings/pipeline';
import { buildKnowledgeChunkRecords } from './chunk-builder.service';
import {
  cleanupStaleHashes,
  detectContentChange,
  loadExistingHashes,
  persistContentHash,
} from './content-hash.service';
import {
  collectCourseKnowledgeSources,
  collectLectureKnowledgeSources,
} from './content-collector.service';
import { extractorRegistry } from './extractor-registry';
import { registerDefaultExtractors } from './extractors';

export type KnowledgeIngestionStats = {
  sourcesCollected: number;
  sourcesExtracted: number;
  sourcesSkipped: number;
  sourcesUnchanged: number;
  chunksGenerated: number;
  chunksIndexed: number;
  embeddingsGenerated: number;
  errors: number;
  staleSourcesRemoved: number;
};

export type KnowledgeIngestionResult = KnowledgeIngestionStats & {
  courseId: string;
  courseSlug: string;
  lectureId?: string;
};

export type KnowledgeIngestionDeps = {
  embeddingPort: EmbeddingPort;
  knowledgeChunkRepository: KnowledgeChunkRepositoryPort;
  hashRepository: KnowledgeSourceHashRepositoryPort;
};

function createEmptyStats(): KnowledgeIngestionStats {
  return {
    sourcesCollected: 0,
    sourcesExtracted: 0,
    sourcesSkipped: 0,
    sourcesUnchanged: 0,
    chunksGenerated: 0,
    chunksIndexed: 0,
    embeddingsGenerated: 0,
    errors: 0,
    staleSourcesRemoved: 0,
  };
}

async function processSource(params: {
  source: KnowledgeSource;
  existingHashes: Map<string, string>;
  deps: KnowledgeIngestionDeps;
  stats: KnowledgeIngestionStats;
}): Promise<void> {
  const { source, existingHashes, deps, stats } = params;

  logger.info(
    {
      courseId: source.courseId,
      lessonId: source.lessonId,
      sourceId: source.sourceId,
      sourceType: source.sourceType,
    },
    '[KNOWLEDGE_INGESTION_RESOURCE_COLLECTED]',
  );

  const extractor = extractorRegistry.resolve(source);
  if (!extractor) {
    stats.sourcesSkipped += 1;
    logger.warn(
      {
        sourceId: source.sourceId,
        sourceType: source.sourceType,
      },
      '[KNOWLEDGE_INGESTION_NO_EXTRACTOR]',
    );
    return;
  }

  try {
    const extraction = await extractor.extract(source);
    if (isExtractionSkipped(extraction)) {
      stats.sourcesSkipped += 1;
      logger.info(
        {
          sourceId: source.sourceId,
          skipReason: extraction.skipReason,
        },
        '[KNOWLEDGE_INGESTION_RESOURCE_SKIPPED]',
      );
      return;
    }

    stats.sourcesExtracted += 1;
    logger.info(
      {
        sourceId: source.sourceId,
        extractionMethod: extraction.extractionMethod,
        textLength: extraction.text.length,
      },
      '[KNOWLEDGE_INGESTION_RESOURCE_EXTRACTED]',
    );

    const change = detectContentChange({
      sourceId: source.sourceId,
      normalizedText: extraction.text,
      existingHash: existingHashes.get(source.sourceId) ?? null,
    });

    if (!change.hasChanged) {
      stats.sourcesUnchanged += 1;
      logger.info(
        { sourceId: source.sourceId },
        '[KNOWLEDGE_INGESTION_CONTENT_UNCHANGED]',
      );
      return;
    }

    const chunkRecords = buildKnowledgeChunkRecords(source, extraction.text);
    stats.chunksGenerated += chunkRecords.length;

    logger.info(
      {
        sourceId: source.sourceId,
        chunksGenerated: chunkRecords.length,
      },
      '[KNOWLEDGE_INGESTION_CHUNK_GENERATION]',
    );

    if (chunkRecords.length === 0) {
      await deps.knowledgeChunkRepository.deleteBySourceId(source.sourceId);
      await persistContentHash({
        sourceId: source.sourceId,
        courseId: source.courseId,
        lectureId: source.lessonId,
        contentHash: change.contentHash,
        hashRepository: deps.hashRepository,
      });
      return;
    }

    const indexedChunks = await embedRecords(chunkRecords, deps.embeddingPort);
    stats.embeddingsGenerated += indexedChunks.length;

    logger.info(
      {
        sourceId: source.sourceId,
        embeddingsGenerated: indexedChunks.length,
      },
      '[KNOWLEDGE_INGESTION_EMBEDDINGS_GENERATED]',
    );

    await deps.knowledgeChunkRepository.deleteBySourceId(source.sourceId);
    await deps.knowledgeChunkRepository.insertMany(indexedChunks);
    await persistContentHash({
      sourceId: source.sourceId,
      courseId: source.courseId,
      lectureId: source.lessonId,
      contentHash: change.contentHash,
      hashRepository: deps.hashRepository,
    });

    stats.chunksIndexed += indexedChunks.length;
    logger.info(
      {
        sourceId: source.sourceId,
        chunksIndexed: indexedChunks.length,
      },
      '[KNOWLEDGE_INGESTION_CHUNKS_WRITTEN]',
    );
  } catch (error) {
    stats.errors += 1;
    logger.error(
      {
        sourceId: source.sourceId,
        sourceType: source.sourceType,
        error,
      },
      '[KNOWLEDGE_INGESTION_RESOURCE_ERROR]',
    );
  }
}

async function runIngestion(params: {
  course: CourseForIndexingDTO;
  sources: KnowledgeSource[];
  lectureId?: string;
  deps: KnowledgeIngestionDeps;
}): Promise<KnowledgeIngestionResult> {
  registerDefaultExtractors();

  const startedAt = performance.now();
  const stats = createEmptyStats();
  stats.sourcesCollected = params.sources.length;

  logger.info(
    {
      courseId: params.course.id,
      lectureId: params.lectureId,
      sourcesCollected: params.sources.length,
    },
    '[KNOWLEDGE_INGESTION_COURSE_STARTED]',
  );

  const existingHashes = await loadExistingHashes({
    courseId: params.course.id,
    lectureId: params.lectureId,
    hashRepository: params.deps.hashRepository,
  });

  for (const source of params.sources) {
    await processSource({
      source,
      existingHashes,
      deps: params.deps,
      stats,
    });
  }

  const activeSourceIds = new Set(params.sources.map((source) => source.sourceId));
  const staleSourceIds = await cleanupStaleHashes({
    activeSourceIds,
    courseId: params.course.id,
    lectureId: params.lectureId,
    hashRepository: params.deps.hashRepository,
  });

  if (staleSourceIds.length > 0) {
    await params.deps.knowledgeChunkRepository.deleteBySourceIds(staleSourceIds);
  }

  stats.staleSourcesRemoved = staleSourceIds.length;

  await params.deps.knowledgeChunkRepository.markCourseIndexed(params.course.id);

  logger.info(
    {
      courseId: params.course.id,
      lectureId: params.lectureId,
      durationMs: Math.round(performance.now() - startedAt),
      ...stats,
    },
    '[KNOWLEDGE_INGESTION_COURSE_COMPLETED]',
  );

  return {
    courseId: params.course.id,
    courseSlug: params.course.slug,
    lectureId: params.lectureId,
    ...stats,
  };
}

export async function ingestCourseKnowledge(
  course: CourseForIndexingDTO,
  deps: KnowledgeIngestionDeps,
): Promise<KnowledgeIngestionResult> {
  const { sources } = collectCourseKnowledgeSources(course);
  return runIngestion({ course, sources, deps });
}

export async function ingestLectureKnowledge(
  course: CourseForIndexingDTO,
  lectureId: string,
  deps: KnowledgeIngestionDeps,
): Promise<KnowledgeIngestionResult> {
  const { sources } = collectLectureKnowledgeSources(course, lectureId);
  return runIngestion({ course, sources, lectureId, deps });
}
