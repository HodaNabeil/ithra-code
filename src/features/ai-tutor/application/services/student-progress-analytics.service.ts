import type {
  AssessmentPerformanceSummary,
  LectureProgressItem,
  SectionProgressSummary,
} from '../../domain/models/StudentProgressAnalytics';

const ASSESSMENT_TYPES = {
  QUIZ: 'QUIZ',
  ASSIGNMENT: 'ASSIGNMENT',
} as const;

export function analyzeAssessmentPerformance(
  lectures: LectureProgressItem[],
): AssessmentPerformanceSummary {
  const quizzes = lectures.filter(
    (lecture) => lecture.type === ASSESSMENT_TYPES.QUIZ,
  );
  const assignments = lectures.filter(
    (lecture) => lecture.type === ASSESSMENT_TYPES.ASSIGNMENT,
  );
  const completedQuizzes = quizzes.filter(
    (lecture) => lecture.isCompleted,
  ).length;
  const completedAssignments = assignments.filter(
    (lecture) => lecture.isCompleted,
  ).length;
  const totalAssessments = quizzes.length + assignments.length;
  const completedAssessments = completedQuizzes + completedAssignments;

  return {
    totalQuizzes: quizzes.length,
    completedQuizzes,
    totalAssignments: assignments.length,
    completedAssignments,
    assessmentCompletionRate:
      totalAssessments === 0
        ? 100
        : Math.round((completedAssessments / totalAssessments) * 100),
  };
}

export function buildSectionProgressSummaries(
  lectures: LectureProgressItem[],
): SectionProgressSummary[] {
  const sections = new Map<
    string,
    {
      sectionTitle: string;
      sectionPosition: number;
      completedLectures: number;
      totalLectures: number;
    }
  >();

  for (const lecture of lectures) {
    const key = `${lecture.sectionPosition}:${lecture.sectionTitle}`;
    const existing = sections.get(key) ?? {
      sectionTitle: lecture.sectionTitle,
      sectionPosition: lecture.sectionPosition,
      completedLectures: 0,
      totalLectures: 0,
    };

    existing.totalLectures += 1;
    if (lecture.isCompleted) {
      existing.completedLectures += 1;
    }

    sections.set(key, existing);
  }

  return [...sections.values()]
    .sort((left, right) => left.sectionPosition - right.sectionPosition)
    .map((section) => ({
      sectionTitle: section.sectionTitle,
      sectionPosition: section.sectionPosition,
      completedLectures: section.completedLectures,
      totalLectures: section.totalLectures,
      completionPercentage:
        section.totalLectures === 0
          ? 0
          : Math.round(
              (section.completedLectures / section.totalLectures) * 100,
            ),
    }));
}

export function formatAssessmentPerformanceSummary(
  summary: AssessmentPerformanceSummary,
): string {
  const parts: string[] = [];

  if (summary.totalQuizzes > 0) {
    parts.push(
      `الاختبارات: ${summary.completedQuizzes}/${summary.totalQuizzes} مكتملة`,
    );
  }

  if (summary.totalAssignments > 0) {
    parts.push(
      `الواجبات: ${summary.completedAssignments}/${summary.totalAssignments} مكتملة`,
    );
  }

  if (parts.length === 0) {
    return 'لا توجد تقييمات في هذه الدورة حتى الآن.';
  }

  return `${parts.join(' | ')} (نسبة إكمال التقييمات: ${summary.assessmentCompletionRate}%)`;
}

export function formatKnowledgeGapsForPrompt(
  gaps: Array<{ lectureTitle: string; sectionTitle: string; reason: string }>,
): string {
  if (gaps.length === 0) {
    return 'لا توجد فجوات تعلم واضحة حالياً.';
  }

  return gaps
    .map((gap) => {
      const reasonLabel =
        gap.reason === 'incomplete_assessment'
          ? 'تقييم غير مكتمل'
          : gap.reason === 'skipped_lecture'
            ? 'محاضرة تم تخطيها'
            : gap.reason === 'low_engagement'
              ? 'تفاعل منخفض مع المحتوى'
              : 'محتوى سابق غير مكتمل';

      return `- ${gap.lectureTitle} (${gap.sectionTitle}): ${reasonLabel}`;
    })
    .join('\n');
}

export function formatSectionProgressForPrompt(
  sections: SectionProgressSummary[],
): string {
  if (sections.length === 0) {
    return 'لا توجد أقسام.';
  }

  return sections
    .map(
      (section) =>
        `- ${section.sectionTitle}: ${section.completionPercentage}% (${section.completedLectures}/${section.totalLectures})`,
    )
    .join('\n');
}
