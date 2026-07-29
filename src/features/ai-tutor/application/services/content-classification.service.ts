import {
  AttachmentType,
  KnowledgeContentType,
  KnowledgeSensitivity,
  LectureType,
} from '@/generated/prisma/enums';

import {
  detectInstructorOnlyContent,
  extractAssessmentHints,
} from './assessment-content.service';

export type ClassifiableContent = {
  lectureType?: LectureType;
  attachmentType?: AttachmentType;
  sourceKind: 'course' | 'lecture' | 'attachment' | 'transcript';
  contentField?: 'description' | 'content';
  text?: string;
  isAssessmentHint?: boolean;
};

export type ContentClassificationResult = {
  contentType: KnowledgeContentType;
  sensitivity: KnowledgeSensitivity;
  metadata?: Record<string, unknown>;
};

const ASSESSMENT_LECTURE_TYPES = new Set<LectureType>([
  LectureType.QUIZ,
  LectureType.ASSIGNMENT,
]);

const CODE_ATTACHMENT_TYPES = new Set<AttachmentType>([
  AttachmentType.CODE,
  AttachmentType.HTML,
  AttachmentType.TEXT,
]);

export function classifyContent(
  input: ClassifiableContent,
): ContentClassificationResult {
  if (input.text && detectInstructorOnlyContent(input.text)) {
    return {
      contentType: KnowledgeContentType.ATTACHMENT,
      sensitivity: KnowledgeSensitivity.INSTRUCTOR,
      metadata: { classificationReason: 'instructor_only_pattern' },
    };
  }

  if (input.isAssessmentHint) {
    return {
      contentType: KnowledgeContentType.LECTURE_DESCRIPTION,
      sensitivity: KnowledgeSensitivity.PUBLIC,
      metadata: {
        assessmentReference: true,
        canBeUsedAsHint: true,
      },
    };
  }

  if (input.sourceKind === 'course') {
    return {
      contentType: KnowledgeContentType.COURSE_OVERVIEW,
      sensitivity: KnowledgeSensitivity.PUBLIC,
    };
  }

  if (input.sourceKind === 'transcript') {
    return {
      contentType: KnowledgeContentType.TRANSCRIPT,
      sensitivity: KnowledgeSensitivity.PUBLIC,
      metadata: { format: 'transcript' },
    };
  }

  if (input.sourceKind === 'lecture') {
    if (input.contentField === 'content' && input.lectureType) {
      return classifyLectureContent(input.lectureType);
    }

    return {
      contentType: KnowledgeContentType.LECTURE_DESCRIPTION,
      sensitivity:
        input.lectureType && ASSESSMENT_LECTURE_TYPES.has(input.lectureType)
          ? KnowledgeSensitivity.ASSESSMENT
          : KnowledgeSensitivity.PUBLIC,
    };
  }

  if (input.sourceKind === 'attachment') {
    return classifyAttachmentContent(input.attachmentType, input.text);
  }

  return {
    contentType: KnowledgeContentType.LECTURE_DESCRIPTION,
    sensitivity: KnowledgeSensitivity.PUBLIC,
  };
}

export function classifyLectureContent(
  lectureType: LectureType,
): ContentClassificationResult {
  if (ASSESSMENT_LECTURE_TYPES.has(lectureType)) {
    return {
      contentType: KnowledgeContentType.LECTURE_CONTENT,
      sensitivity: KnowledgeSensitivity.ASSESSMENT,
      metadata: {
        assessmentType:
          lectureType === LectureType.QUIZ ? 'quiz' : 'assignment',
      },
    };
  }

  return {
    contentType: KnowledgeContentType.LECTURE_CONTENT,
    sensitivity: KnowledgeSensitivity.PUBLIC,
  };
}

export function classifyAttachmentContent(
  attachmentType?: AttachmentType,
  text?: string,
): ContentClassificationResult {
  if (text && detectInstructorOnlyContent(text)) {
    return {
      contentType: KnowledgeContentType.ATTACHMENT,
      sensitivity: KnowledgeSensitivity.INSTRUCTOR,
      metadata: { classificationReason: 'instructor_only_pattern' },
    };
  }

  if (attachmentType && CODE_ATTACHMENT_TYPES.has(attachmentType)) {
    return {
      contentType: KnowledgeContentType.ATTACHMENT,
      sensitivity: KnowledgeSensitivity.PUBLIC,
      metadata: {
        format: attachmentType === AttachmentType.CODE ? 'code' : 'text',
        isCodeExample: attachmentType === AttachmentType.CODE,
      },
    };
  }

  if (attachmentType === AttachmentType.PDF) {
    return {
      contentType: KnowledgeContentType.ATTACHMENT,
      sensitivity: KnowledgeSensitivity.PUBLIC,
      metadata: { format: 'pdf' },
    };
  }

  return {
    contentType: KnowledgeContentType.ATTACHMENT,
    sensitivity: KnowledgeSensitivity.PUBLIC,
    metadata: {
      format: attachmentType ?? 'unknown',
    },
  };
}

export function classifyAssessmentHintSource(params: {
  lectureType: LectureType;
  lectureId: string;
  text: string;
}): ExtractedSourceClassification | null {
  const hints = extractAssessmentHints(params.text);
  if (!hints) {
    return null;
  }

  return {
    text: hints,
    classification: classifyContent({
      sourceKind: 'lecture',
      lectureType: params.lectureType,
      contentField: 'description',
      isAssessmentHint: true,
      text: hints,
    }),
    sourceId: `lecture:${params.lectureId}:assessment-hints`,
    titleSuffix: '— أهداف وتعليمات',
    metadata: {
      assessmentReference: {
        lectureId: params.lectureId,
        assessmentType:
          params.lectureType === LectureType.QUIZ ? 'quiz' : 'assignment',
        canBeUsedAsHint: true,
        isAnswer: false,
      },
    },
  };
}

export type ExtractedSourceClassification = {
  text: string;
  classification: ContentClassificationResult;
  sourceId: string;
  titleSuffix: string;
  metadata: Record<string, unknown>;
};
