import { AttachmentType, LectureType } from '@/generated/prisma/enums';

import type { CourseForIndexingDTO } from '@/ai-platform/indexing/domain/ports/CourseContentRepositoryPort';
import type {
  KnowledgeSource,
  KnowledgeSourceType,
} from '@/ai-platform/indexing/domain/models/KnowledgeSource';
import { isLikelyEnglish } from '@/ai-platform/shared/language';
import { classifyAssessmentHintSource } from '@/ai-platform/indexing/services/content-classification.service';
import { detectInstructorOnlyContent } from '@/ai-platform/indexing/services/assessment-content.service';
import { resolveLectureContentSourceType } from './extractors/base-extractor';

export type ContentCollectionStats = {
  sourcesCollected: number;
  lecturesProcessed: number;
  attachmentsDiscovered: number;
};

function detectLanguage(text: string): string {
  return isLikelyEnglish(text) ? 'en' : 'ar';
}

function resolveAttachmentSourceType(
  attachmentType: AttachmentType,
): KnowledgeSourceType | null {
  switch (attachmentType) {
    case AttachmentType.PDF:
      return 'pdf_document';
    case AttachmentType.CODE:
      return 'code_example';
    case AttachmentType.TEXT:
    case AttachmentType.HTML:
      return 'text_attachment';
    default:
      return null;
  }
}

function collectCourseOverview(course: CourseForIndexingDTO): KnowledgeSource[] {
  const overviewParts = [
    course.shortDescription?.trim(),
    course.description?.trim(),
    course.objectives.length > 0
      ? `أهداف الدورة:\n${course.objectives.map((objective) => `- ${objective}`).join('\n')}`
      : null,
  ].filter(Boolean) as string[];

  if (overviewParts.length === 0) {
    return [];
  }

  const text = overviewParts.join('\n\n');

  return [
    {
      courseId: course.id,
      sourceType: 'course_overview',
      sourceId: `course:${course.id}:overview`,
      title: course.title,
      language: detectLanguage(text),
      content: text,
      metadata: { slug: course.slug },
    },
  ];
}

function collectLectureSources(params: {
  course: CourseForIndexingDTO;
  sectionId: string;
  sectionTitle: string;
  lecture: CourseForIndexingDTO['sections'][number]['lectures'][number];
}): KnowledgeSource[] {
  const { course, sectionId, sectionTitle, lecture } = params;
  const sources: KnowledgeSource[] = [];
  const isAssessment =
    lecture.type === LectureType.QUIZ ||
    lecture.type === LectureType.ASSIGNMENT;

  if (lecture.title?.trim()) {
    sources.push({
      courseId: course.id,
      sectionId,
      lessonId: lecture.id,
      sourceType: 'lesson_title',
      sourceId: `lecture:${lecture.id}:title`,
      title: lecture.title,
      language: detectLanguage(lecture.title),
      content: lecture.title,
      lectureType: lecture.type,
      metadata: { sectionTitle, field: 'title' },
    });
  }

  if (lecture.description?.trim()) {
    const descriptionType: KnowledgeSourceType = isAssessment
      ? lecture.type === LectureType.QUIZ
        ? 'quiz'
        : 'assignment'
      : 'lesson_description';

    sources.push({
      courseId: course.id,
      sectionId,
      lessonId: lecture.id,
      sourceType: descriptionType,
      sourceId: `lecture:${lecture.id}:description`,
      title: `${lecture.title} — الوصف`,
      language: detectLanguage(lecture.description),
      content: lecture.description,
      lectureType: lecture.type,
      metadata: { sectionTitle, field: 'description' },
    });
  }

  if (lecture.content?.trim()) {
    const contentSourceType = isAssessment
      ? lecture.type === LectureType.QUIZ
        ? 'quiz'
        : 'assignment'
      : resolveLectureContentSourceType(lecture.content);

    sources.push({
      courseId: course.id,
      sectionId,
      lessonId: lecture.id,
      sourceType: contentSourceType,
      sourceId: `lecture:${lecture.id}:content`,
      title: `${lecture.title} — المحتوى`,
      language: detectLanguage(lecture.content),
      content: lecture.content,
      lectureType: lecture.type,
      metadata: { sectionTitle, field: 'content' },
    });

    if (isAssessment) {
      const hintSource = classifyAssessmentHintSource({
        lectureType: lecture.type,
        lectureId: lecture.id,
        text: lecture.content,
      });

      if (hintSource) {
        sources.push({
          courseId: course.id,
          sectionId,
          lessonId: lecture.id,
          sourceType: 'lesson_description',
          sourceId: hintSource.sourceId,
          title: `${lecture.title} ${hintSource.titleSuffix}`,
          language: detectLanguage(hintSource.text),
          content: hintSource.text,
          lectureType: lecture.type,
          metadata: {
            ...hintSource.metadata,
            sectionTitle,
            field: 'assessment_hints',
          },
        });
      }
    }

    if (detectInstructorOnlyContent(lecture.content)) {
      sources.push({
        courseId: course.id,
        sectionId,
        lessonId: lecture.id,
        sourceType: 'instructor_notes',
        sourceId: `lecture:${lecture.id}:instructor-notes`,
        title: `${lecture.title} — ملاحظات المدرب`,
        language: detectLanguage(lecture.content),
        content: lecture.content,
        lectureType: lecture.type,
        metadata: { sectionTitle, field: 'instructor_notes' },
      });
    }
  }

  if (lecture.transcript?.content?.trim()) {
    sources.push({
      courseId: course.id,
      sectionId,
      lessonId: lecture.id,
      sourceType: 'video_transcript',
      sourceId: `transcript:${lecture.transcript.id}`,
      title: `${lecture.title} — النص`,
      language: detectLanguage(lecture.transcript.content),
      content: lecture.transcript.content,
      metadata: {
        sectionTitle,
        transcriptSource: lecture.transcript.source,
      },
    });
  }

  for (const attachment of lecture.attachments) {
    const attachmentSourceType = resolveAttachmentSourceType(attachment.type);
    if (!attachmentSourceType) {
      continue;
    }

    sources.push({
      courseId: course.id,
      sectionId,
      lessonId: lecture.id,
      sourceType: attachmentSourceType,
      sourceId: `attachment:${attachment.id}`,
      title: attachment.name,
      language: 'ar',
      content: attachment.content,
      attachmentType: attachment.type,
      metadata: {
        sectionTitle,
        lectureTitle: lecture.title,
        attachmentId: attachment.id,
        attachmentType: attachment.type,
        description: attachment.description,
        url: attachment.url,
        mimeType: attachment.mimeType,
      },
    });
  }

  return sources;
}

export function collectCourseKnowledgeSources(
  course: CourseForIndexingDTO,
  options: { includeCourseOverview?: boolean } = {},
): { sources: KnowledgeSource[]; stats: ContentCollectionStats } {
  const includeCourseOverview = options.includeCourseOverview ?? true;
  const sources: KnowledgeSource[] = [];
  let lecturesProcessed = 0;
  let attachmentsDiscovered = 0;

  if (includeCourseOverview) {
    sources.push(...collectCourseOverview(course));
  }

  for (const section of course.sections) {
    for (const lecture of section.lectures) {
      lecturesProcessed += 1;
      const lectureSources = collectLectureSources({
        course,
        sectionId: section.id,
        sectionTitle: section.title,
        lecture,
      });

      attachmentsDiscovered += lectureSources.filter((source) =>
        source.sourceId.startsWith('attachment:'),
      ).length;

      sources.push(...lectureSources);
    }
  }

  return {
    sources,
    stats: {
      sourcesCollected: sources.length,
      lecturesProcessed,
      attachmentsDiscovered,
    },
  };
}

export function collectLectureKnowledgeSources(
  course: CourseForIndexingDTO,
  lectureId: string,
): { sources: KnowledgeSource[]; stats: ContentCollectionStats } {
  const lectureSection = course.sections.find((section) =>
    section.lectures.some((lecture) => lecture.id === lectureId),
  );

  if (!lectureSection) {
    return {
      sources: [],
      stats: {
        sourcesCollected: 0,
        lecturesProcessed: 0,
        attachmentsDiscovered: 0,
      },
    };
  }

  const scopedCourse: CourseForIndexingDTO = {
    ...course,
    sections: [
      {
        ...lectureSection,
        lectures: lectureSection.lectures.filter(
          (lecture) => lecture.id === lectureId,
        ),
      },
    ],
  };

  return collectCourseKnowledgeSources(scopedCourse, {
    includeCourseOverview: false,
  });
}
