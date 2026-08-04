import type { TextExtractorPort } from '@/ai-platform/indexing/domain/ports/TextExtractorPort';
import type {
  KnowledgeSource,
  KnowledgeSourceType,
} from '@/ai-platform/indexing/domain/models/KnowledgeSource';

export class ExtractorRegistry {
  private readonly extractors: TextExtractorPort[] = [];

  register(extractor: TextExtractorPort): void {
    this.extractors.push(extractor);
  }

  registerMany(extractors: TextExtractorPort[]): void {
    for (const extractor of extractors) {
      this.register(extractor);
    }
  }

  resolve(source: KnowledgeSource): TextExtractorPort | null {
    return (
      this.extractors.find((extractor) => extractor.canExtract(source)) ?? null
    );
  }

  getBySourceType(sourceType: KnowledgeSourceType): TextExtractorPort | null {
    return (
      this.extractors.find((extractor) => extractor.sourceType === sourceType) ??
      null
    );
  }

  list(): readonly TextExtractorPort[] {
    return this.extractors;
  }
}

export const extractorRegistry = new ExtractorRegistry();
