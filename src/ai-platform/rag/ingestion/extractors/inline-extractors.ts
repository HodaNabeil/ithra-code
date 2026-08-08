import { LectureType } from '@/generated/prisma/enums';

import { sanitizeAssessmentBody } from '@/ai-platform/indexing/services/assessment-content.service';

import { createInlineTextExtractor } from './base-extractor';

export const lessonTitleExtractor = createInlineTextExtractor({
  sourceType: 'lesson_title',
  canExtract: (source) => source.sourceType === 'lesson_title',
  extractionMethod: 'lesson_title',
});

export const lessonDescriptionExtractor = createInlineTextExtractor({
  sourceType: 'lesson_description',
  canExtract: (source) => source.sourceType === 'lesson_description',
  preserveMarkdown: true,
  extractionMethod: 'lesson_description',
});

export const markdownContentExtractor = createInlineTextExtractor({
  sourceType: 'markdown_content',
  canExtract: (source) => source.sourceType === 'markdown_content',
  preserveMarkdown: true,
  extractionMethod: 'markdown',
});

export const richTextContentExtractor = createInlineTextExtractor({
  sourceType: 'rich_text_content',
  canExtract: (source) => source.sourceType === 'rich_text_content',
  extractionMethod: 'rich_text',
});

export const assignmentExtractor = createInlineTextExtractor({
  sourceType: 'assignment',
  canExtract: (source) =>
    source.sourceType === 'assignment' ||
    (source.sourceType === 'lesson_description' &&
      source.lectureType === LectureType.ASSIGNMENT),
  preserveMarkdown: true,
  extractionMethod: 'assignment',
  sanitizeText: sanitizeAssessmentBody,
});

export const quizExtractor = createInlineTextExtractor({
  sourceType: 'quiz',
  canExtract: (source) =>
    source.sourceType === 'quiz' ||
    (source.sourceType === 'lesson_description' &&
      source.lectureType === LectureType.QUIZ),
  preserveMarkdown: true,
  extractionMethod: 'quiz',
  sanitizeText: sanitizeAssessmentBody,
});

export const courseOverviewExtractor = createInlineTextExtractor({
  sourceType: 'course_overview',
  canExtract: (source) => source.sourceType === 'course_overview',
  preserveMarkdown: true,
  extractionMethod: 'course_overview',
});
