import { describe, expect, it, vi, beforeEach } from 'vitest';

import { buildTutorSessionContext } from '@/features/ai-tutor/application/services/course-context.service';
import { AskTutorError } from '@/features/ai-tutor/application/errors/ask-tutor.errors';
import type { CourseContextServiceDeps } from '@/features/ai-tutor/application/services/course-context.service';
import type { TutorSessionContext } from '@/features/ai-tutor/domain/models/TutorSessionContext';

const cachedContext: TutorSessionContext = {
  courseId: 'course-1',
  userId: 'user-1',
  course: {
    id: 'course-1',
    slug: 'slug',
    title: 'Title',
    description: 'desc',
    level: 'beginner',
    objectives: [],
    requirements: [],
    knowledgeIndexed: false,
  },
  student: {
    displayName: 'Student',
    learningLevel: 'beginner',
    progressTier: 'start',
  },
  studentProgress: {
    enrollmentStatus: 'ACTIVE',
    completedLectures: 0,
    totalLectures: 1,
    completionPercentage: 0,
    currentLectureCompleted: false,
    lectureProgress: [],
    sectionProgress: [],
    assessmentPerformance: {
      totalQuizzes: 0,
      completedQuizzes: 0,
      totalAssignments: 0,
      completedAssignments: 0,
      assessmentCompletionRate: 0,
    },
    knowledgeGaps: [],
  },
  lectureCatalog: [],
};

describe('buildTutorSessionContext enrollment auth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects when enrollment check fails even if cache has context', async () => {
    const deps: CourseContextServiceDeps = {
      courseContextRepository: {
        assertStudentEnrolled: vi
          .fn()
          .mockRejectedValue(new AskTutorError(403, 'denied', 'UNAUTHORIZED')),
        findEnrolledCourseWithProgress: vi.fn(),
        getAccessibleCourseIds: vi.fn(),
      },
      sessionContextCache: {
        get: vi.fn().mockResolvedValue(cachedContext),
        set: vi.fn(),
        invalidate: vi.fn(),
      },
      studentLearningProfileRepository: {
        findByUserAndCourse: vi.fn(),
        upsert: vi.fn(),
        deleteByUserAndCourse: vi.fn(),
      },
    };

    await expect(
      buildTutorSessionContext({ courseSlug: 'slug', userId: 'user-1' }, deps),
    ).rejects.toBeInstanceOf(AskTutorError);

    expect(
      deps.courseContextRepository.assertStudentEnrolled,
    ).toHaveBeenCalled();
    expect(deps.sessionContextCache.get).not.toHaveBeenCalled();
  });
});
