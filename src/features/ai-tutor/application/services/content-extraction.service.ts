import { LectureType, KnowledgeSensitivity, CourseStatus } from '@/generated/prisma/enums';

import { IndexingError, IndexingErrorCodes } from '../errors/indexing.errors';
import type { CourseContentRepositoryPort, CourseForIndexingDTO } from '../../domain/ports/CourseContentRepositoryPort';
import {
  classifyAssessmentHintSource,
  classifyContent,
} from './content-classification.service';
import {
  chunkContentByKind,
  type ContentChunkKind,
} from './text-chunker.service';
import type { KnowledgeChunkRecord } from '../../domain/models/KnowledgeChunk';
import {
  extractAttachmentText,
  type AttachmentExtractionResult,
} from './attachment-content-extractor.service';

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
  lectureType?: Parameters<typeof classifyContent>[0]['lectureType'];
  attachmentType?: Parameters<typeof classifyContent>[0]['attachmentType'];
  metadata?: Record<string, unknown>;
};

export type ExtractionStats = {
  sourcesExtracted: number;
  attachmentsSkipped: number;
  skipReasons: Record<string, number>;
};

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(text?: string | null): string | null {
  if (!text?.trim()) {
    return null;
  }

  const cleaned = stripHtml(text);
  return cleaned.length > 0 ? cleaned : null;
}

function resolveAttachmentChunkKind(
  attachmentType: ExtractedSource['attachmentType'],
): ContentChunkKind {
  if (attachmentType === 'CODE') {
    return 'code';
  }

  if (attachmentType === 'PDF') {
    return 'pdf';
  }

  return 'default';
}

function recordSkip(
  stats: ExtractionStats,
  result: AttachmentExtractionResult,
): void {
  if (!result.skipped) {
    return;
  }

  stats.attachmentsSkipped += 1;
  const reason = result.skipReason ?? 'unknown';
  stats.skipReasons[reason] = (stats.skipReasons[reason] ?? 0) + 1;
}

export type ContentExtractionDeps = {
  courseContentRepository: CourseContentRepositoryPort;
};

export async function loadCourseForIndexing(
  courseSlug: string,
  deps: ContentExtractionDeps,
): Promise<CourseForIndexingDTO> {
  const course = await deps.courseContentRepository.findPublishedCourseForIndexing(
    courseSlug,
  );

  if (!course) {
    throw new IndexingError(404, 'الدورة غير موجودة', IndexingErrorCodes.COURSE_NOT_FOUND);
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

export async function extractCourseSources(
  course: CourseForIndexingDTO,
): Promise<{ sources: ExtractedSource[]; stats: ExtractionStats }> {
  const sources: ExtractedSource[] = [];
  const stats: ExtractionStats = {
    sourcesExtracted: 0,
    attachmentsSkipped: 0,
    skipReasons: {},
  };

  const courseOverviewParts = [
    normalizeText(course.shortDescription),
    normalizeText(course.description),
    course.objectives.length > 0
      ? `أهداف الدورة:\n${course.objectives.map((objective) => `- ${objective}`).join('\n')}`
      : null,
  ].filter(Boolean) as string[];

  if (courseOverviewParts.length > 0) {
    sources.push({
      sourceId: `course:${course.id}:overview`,
      title: course.title,
      courseId: course.id,
      text: courseOverviewParts.join('\n\n'),
      sourceKind: 'course',
      chunkKind: 'default',
      metadata: { slug: course.slug },
    });
  }

  for (const section of course.sections) {
    for (const lecture of section.lectures) {
      const isAssessmentLecture =
        lecture.type === LectureType.QUIZ ||
        lecture.type === LectureType.ASSIGNMENT;

      const description = normalizeText(lecture.description);
      if (description) {
        sources.push({
          sourceId: `lecture:${lecture.id}:description`,
          title: `${lecture.title} — الوصف`,
          courseId: course.id,
          sectionId: section.id,
          lectureId: lecture.id,
          text: description,
          sourceKind: 'lecture',
          chunkKind: isAssessmentLecture ? 'assessment' : 'default',
          contentField: 'description',
          lectureType: lecture.type,
          metadata: {
            sectionTitle: section.title,
            field: 'description',
          },
        });
      }

      const lectureContent = normalizeText(lecture.content);
      if (lectureContent) {
        sources.push({
          sourceId: `lecture:${lecture.id}:content`,
          title: `${lecture.title} — المحتوى`,
          courseId: course.id,
          sectionId: section.id,
          lectureId: lecture.id,
          text: lectureContent,
          sourceKind: 'lecture',
          chunkKind: isAssessmentLecture ? 'assessment' : 'default',
          contentField: 'content',
          lectureType: lecture.type,
          metadata: {
            sectionTitle: section.title,
            field: 'content',
          },
        });

        if (isAssessmentLecture) {
          const hintSource = classifyAssessmentHintSource({
            lectureType: lecture.type,
            lectureId: lecture.id,
            text: lectureContent,
          });

          if (hintSource) {
            sources.push({
              sourceId: hintSource.sourceId,
              title: `${lecture.title} ${hintSource.titleSuffix}`,
              courseId: course.id,
              sectionId: section.id,
              lectureId: lecture.id,
              text: hintSource.text,
              sourceKind: 'lecture',
              chunkKind: 'assessment',
              contentField: 'description',
              lectureType: lecture.type,
              metadata: {
                ...hintSource.metadata,
                sectionTitle: section.title,
                field: 'assessment_hints',
              },
            });
          }
        }
      }

      if (lecture.transcript?.content) {
        const transcript = normalizeText(lecture.transcript.content);
        if (transcript) {
          sources.push({
            sourceId: `transcript:${lecture.transcript.id}`,
            title: `${lecture.title} — النص`,
            courseId: course.id,
            sectionId: section.id,
            lectureId: lecture.id,
            text: transcript,
            sourceKind: 'transcript',
            chunkKind: 'transcript',
            metadata: {
              sectionTitle: section.title,
              transcriptSource: lecture.transcript.source,
            },
          });
        }
      }

      for (const attachment of lecture.attachments) {
        const extraction = await extractAttachmentText({
          id: attachment.id,
          name: attachment.name,
          type: attachment.type,
          url: attachment.url,
          content: attachment.content,
          description: attachment.description,
          mimeType: attachment.mimeType,
        });

        recordSkip(stats, extraction);

        if (!extraction.text) {
          continue;
        }

        sources.push({
          sourceId: `attachment:${attachment.id}`,
          title: attachment.name,
          courseId: course.id,
          sectionId: section.id,
          lectureId: lecture.id,
          text: extraction.text,
          sourceKind: 'attachment',
          chunkKind: resolveAttachmentChunkKind(attachment.type),
          attachmentType: attachment.type,
          metadata: {
            sectionTitle: section.title,
            lectureTitle: lecture.title,
            attachmentType: attachment.type,
            extractionMethod: extraction.extractionMethod,
            mimeType: attachment.mimeType ?? undefined,
          },
        });
      }
    }
  }

  stats.sourcesExtracted = sources.length;
  return { sources, stats };
}

export function buildChunkRecords(sources: ExtractedSource[]): KnowledgeChunkRecord[] {
  const records: KnowledgeChunkRecord[] = [];

  for (const source of sources) {
    const classification = classifyContent({
      sourceKind: source.sourceKind,
      lectureType: source.lectureType,
      attachmentType: source.attachmentType,
      contentField: source.contentField,
      text: source.text,
      isAssessmentHint: source.metadata?.field === 'assessment_hints',
    });

    if (classification.sensitivity === KnowledgeSensitivity.INSTRUCTOR) {
      continue;
    }

    const chunks = chunkContentByKind(source.text, source.chunkKind);
    for (const chunk of chunks) {
      records.push({
        id: crypto.randomUUID(),
        courseId: source.courseId,
        sectionId: source.sectionId,
        lectureId: source.lectureId,
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
          sourceKind: source.sourceKind,
          chunkKind: source.chunkKind,
        },
      });
    }
  }

  return records;
}
