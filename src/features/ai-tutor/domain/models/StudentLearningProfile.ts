/**
 * StudentLearningProfile
 *
 * Inferred learning preferences used to adapt tutor responses.
 */

export type ExplanationDepth = 'concise' | 'balanced' | 'detailed';

export type ContentStyle = 'theory' | 'balanced' | 'code_heavy';

export type StudentLearningProfile = {
  userId: string;
  courseId: string;
  explanationDepth: ExplanationDepth;
  contentStyle: ContentStyle;
  /** Confidence in inferred preferences (0-1). */
  confidence: number;
  interactionCount: number;
  lastUpdatedAt: Date;
};

export const DEFAULT_LEARNING_PROFILE: Omit<
  StudentLearningProfile,
  'userId' | 'courseId' | 'lastUpdatedAt'
> = {
  explanationDepth: 'balanced',
  contentStyle: 'balanced',
  confidence: 0,
  interactionCount: 0,
};
