import { KnowledgeSensitivity } from '@/generated/prisma/enums';

import type {
  KnowledgeSource,
  KnowledgeSourceType,
} from '@/ai-platform/indexing/domain/models/KnowledgeSource';
import type { KnowledgeChunkRecord } from '@/ai-platform/indexing/domain/models/KnowledgeChunk';
import { classifyContent } from '@/ai-platform/indexing/services/content-classification.service';
import {
  chunkContentByKind,
  type ContentChunkKind,
} from '@/ai-platform/indexing/services/text-chunker.service';

function resolveSourceKind(
  sourceType: KnowledgeSourceType,
): 'course' | 'lecture' | 'attachment' | 'transcript' {
  if (sourceType === 'course_overview') {
    return 'course';
  }

  if (sourceType === 'video_transcript') {
    return 'transcript';
  }

  if (
    sourceType === 'pdf_document' ||
    sourceType === 'text_attachment' ||
    sourceType === 'code_example'
  ) {
    return 'attachment';
  }

  return 'lecture';
}

function resolveChunkKind(source: KnowledgeSource): ContentChunkKind {
  switch (source.sourceType) {
    case 'video_transcript':
      return 'transcript';
    case 'code_example':
      return 'code';
    case 'pdf_document':
      return 'pdf';
    case 'quiz':
    case 'assignment':
      return 'assessment';
    case 'markdown_content':
      return 'markdown';
    default:
      return 'default';
  }
}

function resolveContentField(
  source: KnowledgeSource,
): 'description' | 'content' | undefined {
  const field = source.metadata?.field;
  if (field === 'description' || field === 'content') {
    return field;
  }

  if (
    source.sourceType === 'lesson_description' ||
    source.sourceType === 'quiz' ||
    source.sourceType === 'assignment'
  ) {
    return 'description';
  }

  if (
    source.sourceType === 'markdown_content' ||
    source.sourceType === 'rich_text_content'
  ) {
    return 'content';
  }

  return undefined;
}

export function buildKnowledgeChunkRecords(
  source: KnowledgeSource,
  extractedText: string,
): KnowledgeChunkRecord[] {
  const classification = classifyContent({
    sourceKind: resolveSourceKind(source.sourceType),
    lectureType: source.lectureType,
    attachmentType: source.attachmentType,
    contentField: resolveContentField(source),
    text: extractedText,
    isAssessmentHint: source.metadata?.field === 'assessment_hints',
  });

  if (
    classification.sensitivity === KnowledgeSensitivity.INSTRUCTOR ||
    classification.sensitivity === KnowledgeSensitivity.ASSESSMENT
  ) {
    return [];
  }

  const chunkKind = resolveChunkKind(source);
  const chunks = chunkContentByKind(extractedText, chunkKind);

  return chunks.map((chunk) => ({
    id: crypto.randomUUID(),
    courseId: source.courseId,
    sectionId: source.sectionId,
    lectureId: source.lessonId,
    sourceId: source.sourceId,
    title: source.title,
    content: chunk.content,
    contentType: classification.contentType,
    sensitivity: classification.sensitivity,
    chunkIndex: chunk.chunkIndex,
    tokenCount: chunk.tokenCount,
    metadata: {
      ...source.metadata,
      ...classification.metadata,
      sourceType: source.sourceType,
      chunkKind,
      lessonTitle: source.metadata?.lectureTitle ?? source.title,
      sourceTitle: source.title,
      language: source.language,
      totalChunks: chunk.totalChunks ?? chunks.length,
    },
  }));
}
