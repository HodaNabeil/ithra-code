import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildSystemPrompt,
} from '@/features/ai-tutor/application/services/prompt-builder';
import type { TutorSessionContext } from '@/features/ai-tutor/domain/models/TutorSessionContext';

function createSessionContext(): TutorSessionContext {
  return {
    courseId: 'course-1',
    userId: 'user-1',
    lectureId: 'lecture-1',
    course: {
      id: 'course-1',
      title: 'React Fundamentals',
      slug: 'react-fundamentals',
      description: 'Learn React from scratch',
      level: 'BEGINNER',
      shortDescription: 'Learn React basics',
      objectives: ['Understand components', 'Use hooks'],
      requirements: [],
    },
    lecture: {
      id: 'lecture-1',
      title: 'React Context',
      description: 'Intro to Context API',
      sectionTitle: 'State Management',
      sectionPosition: 2,
      position: 3,
      isCompleted: false,
    },
    studentProgress: {
      completionPercentage: 35,
      completedLectures: 3,
      totalLectures: 9,
      enrollmentStatus: 'ACTIVE',
      currentLectureCompleted: false,
      lectureProgress: [],
      sectionProgress: [],
      assessmentPerformance: {
        totalQuizzes: 0,
        completedQuizzes: 0,
        totalAssignments: 0,
        completedAssignments: 0,
        assessmentCompletionRate: 100,
      },
      knowledgeGaps: [],
    },
    lectureCatalog: [
      {
        id: 'lecture-1',
        title: 'React Context',
        description: 'Intro to Context API',
        sectionTitle: 'State Management',
      },
    ],
  };
}

describe('prompt-builder RAG integration', () => {
  it('includes retrieved chunks in the system prompt', () => {
    const prompt = buildSystemPrompt(createSessionContext(), [
      {
        id: 'chunk-1',
        title: 'Context API',
        content: 'createContext wraps components with Provider',
        score: 0.88,
        contentType: 'LECTURE_CONTENT',
        lectureId: 'lecture-1',
      },
    ]);

    assert.match(prompt, /مواد الدورة ذات الصلة/);
    assert.match(prompt, /Context API/);
    assert.match(prompt, /createContext wraps components with Provider/);
    assert.match(prompt, /88%/);
  });

  it('uses fallback guidance when no chunks are retrieved', () => {
    const prompt = buildSystemPrompt(createSessionContext(), []);

    assert.match(prompt, /لم يتم العثور على مواد دورة مطابقة/);
    assert.doesNotMatch(prompt, /مواد الدورة ذات الصلة/);
  });
});
