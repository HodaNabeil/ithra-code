import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AttachmentType, LectureType } from '@/generated/prisma/enums';
import {
  classifyAttachmentContent,
  classifyAssessmentHintSource,
  classifyContent,
  classifyLectureContent,
} from '@/features/ai-tutor/application/services/content-classification.service';
import {
  detectInstructorOnlyContent,
  extractAssessmentHints,
} from '@/features/ai-tutor/application/services/assessment-content.service';
import { chunkContentByKind } from '@/features/ai-tutor/application/services/text-chunker.service';

describe('content-classification Sprint 6', () => {
  it('marks quiz lecture content as assessment', () => {
    const result = classifyLectureContent(LectureType.QUIZ);
    assert.equal(result.sensitivity, 'ASSESSMENT');
  });

  it('marks code attachments as public learning examples', () => {
    const result = classifyAttachmentContent(AttachmentType.CODE);
    assert.equal(result.sensitivity, 'PUBLIC');
    assert.equal(result.metadata?.isCodeExample, true);
  });

  it('detects instructor-only answer key content', () => {
    assert.equal(
      detectInstructorOnlyContent('Answer Key: Question 1 is React hooks'),
      true,
    );

    const classified = classifyContent({
      sourceKind: 'attachment',
      attachmentType: AttachmentType.PDF,
      text: 'Solution Key for midterm exam',
    });
    assert.equal(classified.sensitivity, 'INSTRUCTOR');
  });

  it('extracts public assessment hints from quiz content', () => {
    const text = `
Learning objectives:
- Understand React Context
- Apply providers correctly

Question 1: What is Context?
Correct answer: useContext hook
`;

    const hints = extractAssessmentHints(text);
    assert.match(hints ?? '', /Learning objectives/i);
    assert.doesNotMatch(hints ?? '', /Correct answer/i);

    const hintSource = classifyAssessmentHintSource({
      lectureType: LectureType.QUIZ,
      lectureId: 'lecture-1',
      text,
    });

    assert.ok(hintSource);
    assert.equal(hintSource?.classification.sensitivity, 'PUBLIC');
    assert.equal(
      (hintSource?.metadata.assessmentReference as { canBeUsedAsHint?: boolean })
        ?.canBeUsedAsHint,
      true,
    );
  });
});

describe('text-chunker Sprint 6', () => {
  it('chunks code content by logical blocks', () => {
    const code = `function a() { return 1; }\n\nfunction b() { return 2; }\n\nfunction c() { return 3; }`;
    const chunks = chunkContentByKind(code, 'code');
    assert.ok(chunks.length >= 1);
    assert.match(chunks[0]?.content ?? '', /function a/);
  });

  it('chunks transcripts with line-based strategy', () => {
    const transcript = Array.from(
      { length: 120 },
      (_, index) => `Transcript line ${index} with extra context about the lecture topic`,
    ).join('\n');
    const chunks = chunkContentByKind(transcript, 'transcript');
    assert.ok(chunks.length > 1);
  });
});
