import { CourseStatus } from '@/generated/prisma/enums';

import { IndexingError, IndexingErrorCodes } from '../errors/indexing.errors';
import type {
  CourseContentRepositoryPort,
  CourseForIndexingDTO,
} from '@/ai-platform';
import type { KnowledgeChunkRecord } from '@/ai-platform';
import {
  collectCourseKnowledgeSources,
  collectLectureKnowledgeSources,
} from '@/ai-platform/rag/ingestion/content-collector.service';
import { buildKnowledgeChunkRecords } from '@/ai-platform/rag/ingestion/chunk-builder.service';
import { extractorRegistry } from '@/ai-platform/rag/ingestion/extractor-registry';
import { registerDefaultExtractors } from '@/ai-platform/rag/ingestion/extractors';
import { isExtractionSkipped } from '@/ai-platform';
import type { ContentChunkKind } from '@/ai-platform/indexing/services/text-chunker.service';
import type { ClassifiableContent } from '@/ai-platform/indexing/services/content-classification.service';

export type ExtractedSource = {
  sourceId: string;
  title: string;
  courseId: string;
  sectionId?: string;
  lectureId?: string;
  text: string;
  sourceKind: 'course' | 'lecture' | 'attachment' | 'transcript';
  chunkKind: ContentChunkKind;
  contentField?: 'description' | 'content';
  lectureType?: ClassifiableContent['lectureType'];
  attachmentType?: ClassifiableContent['attachmentType'];
  metadata?: Record<string, unknown>;
};

export type ExtractionStats = {
  sourcesExtracted: number;
  attachmentsSkipped: number;
  skipReasons: Record<string, number>;
};

function mapSourceKind(sourceType: string): ExtractedSource['sourceKind'] {
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

function mapChunkKind(sourceType: string): ContentChunkKind {
  switch (sourceType) {
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

export type ContentExtractionDeps = {
  courseContentRepository: CourseContentRepositoryPort;
};

export async function loadCourseForIndexing(
  courseSlug: string,
  deps: ContentExtractionDeps,
): Promise<CourseForIndexingDTO> {
  const course =
    await deps.courseContentRepository.findPublishedCourseForIndexing(
      courseSlug,
    );

  if (!course) {
    throw new IndexingError(
      404,
      'الدورة غير موجودة',
      IndexingErrorCodes.COURSE_NOT_FOUND,
    );
  }

  if (course.status !== CourseStatus.PUBLISHED) {
    throw new IndexingError(
      400,
      'يمكن فهرسة الدورات المنشورة فقط',
      IndexingErrorCodes.COURSE_NOT_PUBLISHED,
    );
  }

  return course;
}

async function extractSourcesFromCollection(
  sources: ReturnType<typeof collectCourseKnowledgeSources>['sources'],
): Promise<{ sources: ExtractedSource[]; stats: ExtractionStats }> {
  registerDefaultExtractors();

  const extractedSources: ExtractedSource[] = [];
  const stats: ExtractionStats = {
    sourcesExtracted: 0,
    attachmentsSkipped: 0,
    skipReasons: {},
  };

  for (const source of sources) {
    const extractor = extractorRegistry.resolve(source);
    if (!extractor) {
      stats.attachmentsSkipped += 1;
      stats.skipReasons.no_extractor =
        (stats.skipReasons.no_extractor ?? 0) + 1;
      continue;
    }

    const result = await extractor.extract(source);
    if (isExtractionSkipped(result)) {
      stats.attachmentsSkipped += 1;
      const reason = result.skipReason ?? 'unknown';
      stats.skipReasons[reason] = (stats.skipReasons[reason] ?? 0) + 1;
      continue;
    }

    extractedSources.push({
      sourceId: source.sourceId,
      title: source.title,
      courseId: source.courseId,
      sectionId: source.sectionId,
      lectureId: source.lessonId,
      text: result.text,
      sourceKind: mapSourceKind(source.sourceType),
      chunkKind: mapChunkKind(source.sourceType),
      contentField:
        source.metadata?.field === 'description'
          ? 'description'
          : source.metadata?.field === 'content'
            ? 'content'
            : undefined,
      lectureType: source.lectureType,
      attachmentType: source.attachmentType,
      metadata: {
        ...source.metadata,
        sourceType: source.sourceType,
        language: source.language,
      },
    });
  }

  stats.sourcesExtracted = extractedSources.length;
  return { sources: extractedSources, stats };
}

export async function extractCourseSources(
  course: CourseForIndexingDTO,
  options: { includeCourseOverview?: boolean } = {},
): Promise<{ sources: ExtractedSource[]; stats: ExtractionStats }> {
  const { sources } = collectCourseKnowledgeSources(course, options);
  return extractSourcesFromCollection(sources);
}

export async function extractLectureSources(
  course: CourseForIndexingDTO,
  lectureId: string,
): Promise<{ sources: ExtractedSource[]; stats: ExtractionStats }> {
  const { sources } = collectLectureKnowledgeSources(course, lectureId);
  return extractSourcesFromCollection(sources);
}

export function buildChunkRecords(
  sources: ExtractedSource[],
): KnowledgeChunkRecord[] {
  const records: KnowledgeChunkRecord[] = [];

  for (const source of sources) {
    const knowledgeSource = {
      courseId: source.courseId,
      sectionId: source.sectionId,
      lessonId: source.lectureId,
      sourceType:
        (source.metadata?.sourceType as string) ?? 'lesson_description',
      sourceId: source.sourceId,
      title: source.title,
      language: String(source.metadata?.language ?? 'ar'),
      content: source.text,
      lectureType: source.lectureType,
      attachmentType: source.attachmentType,
      metadata: source.metadata,
    };

    records.push(
      ...buildKnowledgeChunkRecords(
        knowledgeSource as Parameters<typeof buildKnowledgeChunkRecords>[0],
        source.text,
      ),
    );
  }

  return records;
}
