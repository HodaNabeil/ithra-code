export {
  buildTutorSessionContext,
} from './course-context.service';
export type { CourseContextServiceDeps } from './course-context.service';

export {
  buildConversationMessages,
  buildPromptPreview,
  buildSystemPrompt,
  trimConversationHistory,
} from './prompt-builder';

export {
  loadCourseForIndexing,
  extractCourseSources,
  buildChunkRecords,
} from './content-extraction.service';
export type { ExtractedSource, ExtractionStats } from './content-extraction.service';

export { chunkText, chunkContentByKind } from './text-chunker.service';
export type { TextChunk, ContentChunkKind } from './text-chunker.service';

export {
  classifyContent,
  classifyLectureContent,
  classifyAttachmentContent,
  classifyAssessmentHintSource,
} from './content-classification.service';
export type {
  ClassifiableContent,
  ContentClassificationResult,
  ExtractedSourceClassification,
} from './content-classification.service';

export { extractAttachmentText } from './attachment-content-extractor.service';
export type {
  AttachmentExtractionInput,
  AttachmentExtractionResult,
} from './attachment-content-extractor.service';

export {
  detectInstructorOnlyContent,
  extractAssessmentHints,
  sanitizeAssessmentBody,
  buildAssessmentReferenceMetadata,
} from './assessment-content.service';

export {
  detectAssessmentIntent,
  validateEducationalResponse,
  buildGuidedLearningResponse,
  transformAnswerToGuidance,
  buildAssessmentFallbackSuggestions,
} from './educational-integrity.service';
export type {
  AssessmentIntent,
  ResponseIntegrityResult,
} from './educational-integrity.service';

export {
  rankContentSuggestions,
  formatSuggestionMessage,
  buildSuggestionFallback,
} from './content-suggestion.service';
export type {
  SuggestableLecture,
  ContentSuggestion,
  RankedSuggestionsResult,
} from './content-suggestion.service';

export { detectKnowledgeGaps } from './knowledge-gap.service';
export {
  analyzeAssessmentPerformance,
  buildSectionProgressSummaries,
  formatAssessmentPerformanceSummary,
  formatKnowledgeGapsForPrompt,
  formatSectionProgressForPrompt,
} from './student-progress-analytics.service';
export {
  inferPreferenceSignalsFromText,
  inferPreferenceSignalsFromMessages,
  mergeLearningProfile,
  buildAdaptiveFormattingInstructions,
} from './learning-profile.logic';
export {
  loadStudentLearningProfile,
  saveStudentLearningProfile,
  updateLearningProfileFromInteraction,
} from './learning-profile.service';

export { embedChunkRecords } from './embedding-pipeline.service';
export { retrieveRelevantContent } from './content-retriever.service';
export type {
  ContentRetrieverDeps,
  RetrieveRelevantContentInput,
} from './content-retriever.service';
export {
  buildNoResultsMessage,
  isLikelyEnglish,
  mapChunksToSources,
} from './rag-helpers';
export {
  buildStudentInfo,
  buildLevelAdaptiveInstructions,
  deriveStudentLearningLevel,
  deriveStudentProgressTier,
  detectSessionMetaIntent,
  formatCourseLevelLabel,
  resolveStudentDisplayName,
} from './student-info.service';
export type {
  SessionMetaIntent,
  StudentInfo,
  StudentProgressTier,
} from './student-info.service';
