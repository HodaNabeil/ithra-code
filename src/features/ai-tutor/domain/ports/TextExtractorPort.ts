import type {
  KnowledgeSource,
  KnowledgeSourceType,
  ExtractionResult,
} from '../models/KnowledgeSource';

export interface TextExtractorPort {
  readonly sourceType: KnowledgeSourceType;

  canExtract(source: KnowledgeSource): boolean;

  extract(source: KnowledgeSource): Promise<ExtractionResult>;
}
