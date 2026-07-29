import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { detectKnowledgeGaps } from '@/features/ai-tutor/application/services/knowledge-gap.service';
import {
  analyzeAssessmentPerformance,
  buildSectionProgressSummaries,
  formatAssessmentPerformanceSummary,
  formatKnowledgeGapsForPrompt,
} from '@/features/ai-tutor/application/services/student-progress-analytics.service';
import {
  inferPreferenceSignalsFromText,
  inferPreferenceSignalsFromMessages,
  mergeLearningProfile,
  buildAdaptiveFormattingInstructions,
} from '@/features/ai-tutor/application/services/learning-profile.logic';
import { buildSystemPrompt } from '@/features/ai-tutor/application/services/prompt-builder';
import type { LectureProgressItem } from '@/features/ai-tutor/domain/models/StudentProgressAnalytics';
import type { TutorSessionContext } from '@/features/ai-tutor/domain/models/TutorSessionContext';
import type { MessageDTO } from '@/features/ai-tutor/domain/ports/ConversationRepositoryPort';

function createLectureProgress(
  overrides: Partial<LectureProgressItem> & Pick<LectureProgressItem, 'id' | 'title'>,
): LectureProgressItem {
  return {
    sectionTitle: 'Basics',
    sectionPosition: 1,
    position: 1,
    type: 'VIDEO',
    isCompleted: false,
    timeSpentSeconds: 120,
    ...overrides,
  };
}

function createSessionContext(): TutorSessionContext {
  return {
    courseId: 'course-1',
    userId: 'user-1',
    lectureId: 'lec-2',
    course: {
      id: 'course-1',
      title: 'React Fundamentals',
      slug: 'react-fundamentals',
      description: 'Learn React',
      level: 'BEGINNER',
      objectives: [],
      requirements: [],
    },
    lecture: {
      id: 'lec-2',
      title: 'Hooks',
      sectionTitle: 'State',
      sectionPosition: 2,
      position: 2,
      isCompleted: false,
    },
    studentProgress: {
      enrollmentStatus: 'ACTIVE',
      completedLectures: 1,
      totalLectures: 4,
      completionPercentage: 25,
      currentLectureCompleted: false,
      lectureProgress: [
        createLectureProgress({
          id: 'lec-1',
          title: 'Intro',
          isCompleted: true,
        }),
        createLectureProgress({
          id: 'lec-2',
          title: 'Hooks',
          position: 2,
          isCompleted: false,
        }),
        createLectureProgress({
          id: 'lec-3',
          title: 'Quiz 1',
          type: 'QUIZ',
          position: 3,
          isCompleted: false,
        }),
        createLectureProgress({
          id: 'lec-4',
          title: 'Assignment 1',
          type: 'ASSIGNMENT',
          position: 4,
          isCompleted: true,
        }),
      ],
      sectionProgress: buildSectionProgressSummaries([
        createLectureProgress({
          id: 'lec-1',
          title: 'Intro',
          isCompleted: true,
        }),
        createLectureProgress({
          id: 'lec-2',
          title: 'Hooks',
          position: 2,
          isCompleted: false,
        }),
        createLectureProgress({
          id: 'lec-3',
          title: 'Quiz 1',
          type: 'QUIZ',
          position: 3,
          isCompleted: false,
        }),
        createLectureProgress({
          id: 'lec-4',
          title: 'Assignment 1',
          type: 'ASSIGNMENT',
          position: 4,
          isCompleted: true,
        }),
      ]),
      assessmentPerformance: analyzeAssessmentPerformance([
        createLectureProgress({
          id: 'lec-3',
          title: 'Quiz 1',
          type: 'QUIZ',
          position: 3,
          isCompleted: false,
        }),
        createLectureProgress({
          id: 'lec-4',
          title: 'Assignment 1',
          type: 'ASSIGNMENT',
          position: 4,
          isCompleted: true,
        }),
      ]),
      knowledgeGaps: detectKnowledgeGaps([
        createLectureProgress({
          id: 'lec-1',
          title: 'Intro',
          isCompleted: true,
        }),
        createLectureProgress({
          id: 'lec-2',
          title: 'Hooks',
          position: 2,
          isCompleted: false,
        }),
        createLectureProgress({
          id: 'lec-3',
          title: 'Quiz 1',
          type: 'QUIZ',
          position: 3,
          isCompleted: false,
        }),
        createLectureProgress({
          id: 'lec-4',
          title: 'Assignment 1',
          type: 'ASSIGNMENT',
          position: 4,
          isCompleted: true,
        }),
      ]),
    },
    lectureCatalog: [],
    learningProfile: {
      userId: 'user-1',
      courseId: 'course-1',
      explanationDepth: 'detailed',
      contentStyle: 'code_heavy',
      confidence: 0.7,
      interactionCount: 5,
      lastUpdatedAt: new Date(),
    },
  };
}

describe('student progress analytics Sprint 8', () => {
  it('detects incomplete assessments and skipped lectures as knowledge gaps', () => {
    const lectures = [
      createLectureProgress({ id: 'lec-1', title: 'Intro', isCompleted: true }),
      createLectureProgress({
        id: 'lec-2',
        title: 'Skipped',
        position: 2,
        isCompleted: false,
      }),
      createLectureProgress({
        id: 'lec-3',
        title: 'Later Done',
        position: 3,
        isCompleted: true,
      }),
      createLectureProgress({
        id: 'lec-4',
        title: 'Quiz',
        type: 'QUIZ',
        position: 4,
        isCompleted: false,
      }),
    ];

    const gaps = detectKnowledgeGaps(lectures);
    const reasons = gaps.map((gap) => gap.reason);

    assert.ok(reasons.includes('skipped_lecture'));
    assert.ok(reasons.includes('incomplete_assessment'));
  });

  it('summarizes assessment completion without exposing answer data', () => {
    const summary = analyzeAssessmentPerformance([
      createLectureProgress({
        id: 'quiz-1',
        title: 'Quiz 1',
        type: 'QUIZ',
        isCompleted: false,
      }),
      createLectureProgress({
        id: 'assign-1',
        title: 'Assignment 1',
        type: 'ASSIGNMENT',
        isCompleted: true,
      }),
    ]);

    assert.equal(summary.totalQuizzes, 1);
    assert.equal(summary.completedQuizzes, 0);
    assert.equal(summary.totalAssignments, 1);
    assert.equal(summary.completedAssignments, 1);
    assert.equal(summary.assessmentCompletionRate, 50);

    const formatted = formatAssessmentPerformanceSummary(summary);
    assert.match(formatted, /50%/);
    assert.doesNotMatch(formatted, /answer/i);
  });

  it('formats knowledge gaps for prompt inclusion', () => {
    const formatted = formatKnowledgeGapsForPrompt([
      {
        lectureTitle: 'Quiz 1',
        sectionTitle: 'Basics',
        reason: 'incomplete_assessment',
      },
    ]);

    assert.match(formatted, /Quiz 1/);
    assert.match(formatted, /تقييم غير مكتمل/);
  });
});

describe('learning profile Sprint 8', () => {
  it('infers concise code-focused preferences from short code questions', () => {
    const signals = inferPreferenceSignalsFromText(
      'Show me a quick code example for useEffect',
    );

    assert.equal(signals.explanationDepth, 'concise');
    assert.equal(signals.contentStyle, 'code_heavy');
    assert.ok(signals.signalStrength > 0.4);
  });

  it('infers detailed theory preferences from long conceptual questions', () => {
    const signals = inferPreferenceSignalsFromText(
      'Can you explain in depth why React reconciliation works and help me understand the theory behind virtual DOM diffing step by step?',
    );

    assert.equal(signals.explanationDepth, 'detailed');
    assert.equal(signals.contentStyle, 'theory');
  });

  it('merges profile preferences with increasing confidence', () => {
    const merged = mergeLearningProfile(
      {
        userId: 'user-1',
        courseId: 'course-1',
        explanationDepth: 'balanced',
        contentStyle: 'balanced',
        confidence: 0.2,
        interactionCount: 2,
        lastUpdatedAt: new Date(),
      },
      {
        explanationDepth: 'concise',
        contentStyle: 'code_heavy',
        signalStrength: 0.8,
      },
    );

    assert.equal(merged.explanationDepth, 'concise');
    assert.equal(merged.contentStyle, 'code_heavy');
    assert.equal(merged.interactionCount, 3);
    assert.ok(merged.confidence > 0.2);
  });

  it('aggregates preferences from recent user messages', () => {
    const messages: MessageDTO[] = [
      {
        id: '1',
        threadId: 'thread-1',
        role: 'user',
        content: 'Give me a brief code snippet',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        threadId: 'thread-1',
        role: 'assistant',
        content: 'Here is an example...',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        threadId: 'thread-1',
        role: 'user',
        content: 'Show another quick code example',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const signals = inferPreferenceSignalsFromMessages(messages);
    assert.equal(signals.contentStyle, 'code_heavy');
    assert.equal(signals.explanationDepth, 'concise');
  });

  it('builds adaptive formatting instructions from a confident profile', () => {
    const instructions = buildAdaptiveFormattingInstructions({
      userId: 'user-1',
      courseId: 'course-1',
      explanationDepth: 'detailed',
      contentStyle: 'code_heavy',
      confidence: 0.75,
      interactionCount: 4,
      lastUpdatedAt: new Date(),
    });

    assert.match(instructions, /تفضيلات التعلم/);
    assert.match(instructions, /أمثلة عملية/);
    assert.match(instructions, /خطوة بخطوة/);
  });
});

describe('prompt personalization Sprint 8', () => {
  it('includes progress analytics and adaptive formatting in system prompt', () => {
    const prompt = buildSystemPrompt(createSessionContext(), []);

    assert.match(prompt, /تقدم الأقسام/);
    assert.match(prompt, /أداء التقييمات/);
    assert.match(prompt, /فجوات تعلم محتملة/);
    assert.match(prompt, /تفضيلات التعلم المستنتجة/);
    assert.match(prompt, /أمثلة عملية/);
  });
});
