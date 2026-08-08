import type { AttachmentType, LectureType } from '@/generated/prisma/enums';

/**
 * Supported knowledge source types for the ingestion pipeline.
 * Adding a new type requires only implementing and registering an extractor.
 */
export type KnowledgeSourceType =
  | 'course_overview'
  | 'lesson_title'
  | 'lesson_description'
  | 'markdown_content'
  | 'rich_text_content'
  | 'video_transcript'
  | 'pdf_document'
  | 'text_attachment'
  | 'code_example'
  | 'assignment'
  | 'quiz'
  | 'instructor_notes';

export type KnowledgeSource = {
  courseId: string;
  sectionId?: string;
  lessonId?: string;
  sourceType: KnowledgeSourceType;
  /** Stable identifier for change detection and chunk source_id */
  sourceId: string;
  title: string;
  language: string;
  /** Inline text content when available */
  content?: string | null;
  lectureType?: LectureType;
  attachmentType?: AttachmentType;
  metadata?: Record<string, unknown>;
};

export type ExtractedKnowledgeText = {
  source: KnowledgeSource;
  text: string;
  extractionMethod: string;
};

export type ExtractionSkipResult = {
  source: KnowledgeSource;
  skipped: true;
  skipReason: string;
};

export type ExtractionResult = ExtractedKnowledgeText | ExtractionSkipResult;

export function isExtractionSkipped(
  result: ExtractionResult,
): result is ExtractionSkipResult {
  return 'skipped' in result && result.skipped === true;
}
