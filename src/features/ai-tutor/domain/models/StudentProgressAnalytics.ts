/**
 * Student progress analytics for learning-aware personalization.
 */

export type LectureProgressItem = {
  id: string;
  title: string;
  sectionTitle: string;
  sectionPosition: number;
  position: number;
  type: string;
  isCompleted: boolean;
  timeSpentSeconds: number;
  lastAccessedAt?: Date;
};

export type AssessmentPerformanceSummary = {
  totalQuizzes: number;
  completedQuizzes: number;
  totalAssignments: number;
  completedAssignments: number;
  /** Share of assessment lectures completed (no answer data exposed). */
  assessmentCompletionRate: number;
};

export type KnowledgeGapReason =
  | 'incomplete_assessment'
  | 'incomplete_after_prerequisites'
  | 'skipped_lecture'
  | 'low_engagement';

export type KnowledgeGapSeverity = 'low' | 'medium' | 'high';

export type KnowledgeGap = {
  lectureId: string;
  lectureTitle: string;
  sectionTitle: string;
  reason: KnowledgeGapReason;
  severity: KnowledgeGapSeverity;
};

export type SectionProgressSummary = {
  sectionTitle: string;
  sectionPosition: number;
  completedLectures: number;
  totalLectures: number;
  completionPercentage: number;
};
