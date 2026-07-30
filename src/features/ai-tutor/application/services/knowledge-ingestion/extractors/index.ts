import { extractorRegistry } from '../extractor-registry';
import {
  assignmentExtractor,
  courseOverviewExtractor,
  lessonDescriptionExtractor,
  lessonTitleExtractor,
  markdownContentExtractor,
  quizExtractor,
  richTextContentExtractor,
} from './inline-extractors';
import {
  pdfExtractor,
  textAttachmentExtractor,
} from './attachment-extractors';
import { codeExtractor } from './code-extractor';
import { instructorNotesExtractor } from './instructor-notes-extractor';
import { transcriptExtractor } from './transcript-extractor';

let registered = false;

export function registerDefaultExtractors(): void {
  if (registered) {
    return;
  }

  extractorRegistry.registerMany([
    courseOverviewExtractor,
    lessonTitleExtractor,
    lessonDescriptionExtractor,
    markdownContentExtractor,
    richTextContentExtractor,
    transcriptExtractor,
    pdfExtractor,
    textAttachmentExtractor,
    codeExtractor,
    assignmentExtractor,
    quizExtractor,
    instructorNotesExtractor,
  ]);

  registered = true;
}

export {
  assignmentExtractor,
  codeExtractor,
  courseOverviewExtractor,
  instructorNotesExtractor,
  lessonDescriptionExtractor,
  lessonTitleExtractor,
  markdownContentExtractor,
  pdfExtractor,
  quizExtractor,
  richTextContentExtractor,
  textAttachmentExtractor,
  transcriptExtractor,
};
