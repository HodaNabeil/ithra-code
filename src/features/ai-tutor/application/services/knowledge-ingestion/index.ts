export type {
  KnowledgeSource,
  KnowledgeSourceType,
  ExtractionResult,
  ExtractedKnowledgeText,
} from '../../../domain/models/KnowledgeSource';

export {
  collectCourseKnowledgeSources,
  collectLectureKnowledgeSources,
} from './content-collector.service';

export {
  normalizeKnowledgeText,
  computeContentHash,
  detectContentFormat,
} from './text-normalizer.service';

export {
  detectContentChange,
  loadExistingHashes,
  persistContentHash,
  cleanupStaleHashes,
} from './content-hash.service';

export { buildKnowledgeChunkRecords } from './chunk-builder.service';

export {
  ingestCourseKnowledge,
  ingestLectureKnowledge,
  type KnowledgeIngestionDeps,
  type KnowledgeIngestionResult,
  type KnowledgeIngestionStats,
} from './knowledge-ingestion-pipeline.service';

export { extractorRegistry, ExtractorRegistry } from './extractor-registry';
export { registerDefaultExtractors } from './extractors';
