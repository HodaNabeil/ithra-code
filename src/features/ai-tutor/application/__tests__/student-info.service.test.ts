import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildStudentInfo,
  buildLevelAdaptiveInstructions,
  detectSessionMetaIntent,
  deriveStudentLearningLevel,
  formatCourseLevelLabel,
  resolveStudentDisplayName,
} from '@/features/ai-tutor/application/services/student-info.service';
import type { TutorSessionContext } from '@/features/ai-tutor/domain/models/TutorSessionContext';

describe('student-info service', () => {
  it('resolves display name from first and last name', () => {
    const name = resolveStudentDisplayName({
      name: 'Full Name',
      firstName: 'Hoda',
      lastName: 'Ali',
    });

    assert.equal(name, 'Hoda Ali');
  });

  it('falls back to full name when first name is missing', () => {
    const name = resolveStudentDisplayName({
      name: 'Hoda Ali',
      firstName: null,
      lastName: null,
    });

    assert.equal(name, 'Hoda Ali');
  });

  it('derives learning level from completion percentage', () => {
    assert.equal(
      deriveStudentLearningLevel({ completionPercentage: 10, knowledgeGaps: [] }),
      'في بداية الدورة',
    );
    assert.equal(
      deriveStudentLearningLevel({ completionPercentage: 30, knowledgeGaps: [] }),
      'مبتدئ في الدورة',
    );
    assert.equal(
      deriveStudentLearningLevel({ completionPercentage: 80, knowledgeGaps: [] }),
      'متقدم في الدورة',
    );
  });

  it('detects session meta questions about student identity', () => {
    const arabic = detectSessionMetaIntent('لسه فاكر اسمي؟');
    const english = detectSessionMetaIntent('Do you remember my name?');

    assert.equal(arabic.isSessionMeta, true);
    assert.equal(english.isSessionMeta, true);
  });

  it('does not classify course content questions as session meta', () => {
    const intent = detectSessionMetaIntent('ما هو React Context؟');

    assert.equal(intent.isSessionMeta, false);
  });

  it('builds student info with display name and learning level', () => {
    const info = buildStudentInfo({
      name: null,
      firstName: 'Hoda',
      lastName: 'Ali',
      progress: {
        enrollmentStatus: 'ACTIVE',
        completedLectures: 2,
        totalLectures: 10,
        completionPercentage: 20,
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
    });

    assert.equal(info.displayName, 'Hoda Ali');
    assert.equal(info.learningLevel, 'مبتدئ في الدورة');
    assert.equal(info.progressTier, 'early');
  });

  it('formats course level labels in Arabic', () => {
    assert.equal(formatCourseLevelLabel('BEGINNER'), 'مبتدئ');
    assert.equal(formatCourseLevelLabel('ADVANCED'), 'متقدم');
  });

  it('builds level-adaptive instructions for course and student progress', () => {
    const sessionContext: TutorSessionContext = {
      courseId: 'course-1',
      userId: 'user-1',
      course: {
        id: 'course-1',
        slug: 'react',
        title: 'React',
        description: 'Learn React',
        level: 'BEGINNER',
        objectives: [],
        requirements: [],
      },
      student: {
        displayName: 'Hoda',
        learningLevel: 'مبتدئ في الدورة',
        progressTier: 'early',
      },
      studentProgress: {
        enrollmentStatus: 'ACTIVE',
        completedLectures: 2,
        totalLectures: 10,
        completionPercentage: 20,
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
      lectureCatalog: [],
    };

    const instructions = buildLevelAdaptiveInstructions(sessionContext);

    assert.match(instructions, /تكييف الشرح حسب المستوى/);
    assert.match(instructions, /مستوى الدورة: مبتدئ/);
    assert.match(instructions, /الطالب مبتدئ في الدورة/);
    assert.match(instructions, /Hoda/);
  });
});
