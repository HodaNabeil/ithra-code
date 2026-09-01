import type { MessageDTO } from '../../domain/ports/ConversationRepositoryPort';
import type { StudentLearningProfileRepositoryPort } from '../../domain/ports/StudentLearningProfileRepositoryPort';
import {
  DEFAULT_LEARNING_PROFILE,
  type StudentLearningProfile,
} from '../../domain/models/StudentLearningProfile';
import {
  inferPreferenceSignalsFromMessages,
  inferPreferenceSignalsFromText,
  mergeLearningProfile,
} from './learning-profile.logic';

export {
  inferPreferenceSignalsFromText,
  inferPreferenceSignalsFromMessages,
  mergeLearningProfile,
  buildAdaptiveFormattingInstructions,
} from './learning-profile.logic';
export type { PreferenceSignals } from './learning-profile.logic';

export type LearningProfileServiceDeps = {
  studentLearningProfileRepository: StudentLearningProfileRepositoryPort;
};

function mapRecordToProfile(record: {
  userId: string;
  courseId: string;
  explanationDepth: string;
  contentStyle: string;
  confidence: number;
  interactionCount: number;
  updatedAt: Date;
}): StudentLearningProfile {
  return {
    userId: record.userId,
    courseId: record.courseId,
    explanationDepth:
      record.explanationDepth as StudentLearningProfile['explanationDepth'],
    contentStyle: record.contentStyle as StudentLearningProfile['contentStyle'],
    confidence: record.confidence,
    interactionCount: record.interactionCount,
    lastUpdatedAt: record.updatedAt,
  };
}

export async function loadStudentLearningProfile(
  params: {
    userId: string;
    courseId: string;
  },
  deps: LearningProfileServiceDeps,
): Promise<StudentLearningProfile> {
  const record =
    await deps.studentLearningProfileRepository.findByUserAndCourse(params);

  if (!record) {
    return {
      userId: params.userId,
      courseId: params.courseId,
      ...DEFAULT_LEARNING_PROFILE,
      lastUpdatedAt: new Date(0),
    };
  }

  return mapRecordToProfile(record);
}

export async function saveStudentLearningProfile(
  profile: StudentLearningProfile,
  deps: LearningProfileServiceDeps,
): Promise<StudentLearningProfile> {
  const record = await deps.studentLearningProfileRepository.upsert({
    userId: profile.userId,
    courseId: profile.courseId,
    explanationDepth: profile.explanationDepth,
    contentStyle: profile.contentStyle,
    confidence: profile.confidence,
    interactionCount: profile.interactionCount,
    updatedAt: profile.lastUpdatedAt,
  });

  return mapRecordToProfile(record);
}

export async function updateLearningProfileFromInteraction(
  params: {
    userId: string;
    courseId: string;
    question: string;
    recentMessages?: MessageDTO[];
  },
  deps: LearningProfileServiceDeps,
): Promise<StudentLearningProfile> {
  const existing = await loadStudentLearningProfile(
    {
      userId: params.userId,
      courseId: params.courseId,
    },
    deps,
  );

  const messageSignals = params.recentMessages
    ? inferPreferenceSignalsFromMessages(params.recentMessages)
    : null;
  const questionSignals = inferPreferenceSignalsFromText(params.question);
  const signals = messageSignals
    ? {
        explanationDepth:
          messageSignals.explanationDepth === 'balanced'
            ? questionSignals.explanationDepth
            : messageSignals.explanationDepth,
        contentStyle:
          messageSignals.contentStyle === 'balanced'
            ? questionSignals.contentStyle
            : messageSignals.contentStyle,
        signalStrength: Math.max(
          messageSignals.signalStrength,
          questionSignals.signalStrength,
        ),
      }
    : questionSignals;

  const merged = mergeLearningProfile(existing, signals);
  return saveStudentLearningProfile(merged, deps);
}
