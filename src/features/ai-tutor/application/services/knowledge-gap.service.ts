import type {
  KnowledgeGap,
  KnowledgeGapSeverity,
  LectureProgressItem,
} from '../../domain/models/StudentProgressAnalytics';

const ASSESSMENT_TYPES = new Set(['QUIZ', 'ASSIGNMENT']);
const LOW_ENGAGEMENT_SECONDS = 30;

function severityForGap(
  reason: KnowledgeGap['reason'],
  index: number,
  total: number,
): KnowledgeGapSeverity {
  if (reason === 'incomplete_assessment') {
    return 'high';
  }

  if (reason === 'skipped_lecture') {
    return index < total * 0.5 ? 'high' : 'medium';
  }

  if (reason === 'low_engagement') {
    return 'low';
  }

  return 'medium';
}

export function detectKnowledgeGaps(
  lectures: LectureProgressItem[],
): KnowledgeGap[] {
  const gaps: KnowledgeGap[] = [];
  let priorContentCompleted = true;

  for (let index = 0; index < lectures.length; index += 1) {
    const lecture = lectures[index];
    if (!lecture) {
      continue;
    }

    if (!lecture.isCompleted) {
      if (ASSESSMENT_TYPES.has(lecture.type)) {
        gaps.push({
          lectureId: lecture.id,
          lectureTitle: lecture.title,
          sectionTitle: lecture.sectionTitle,
          reason: 'incomplete_assessment',
          severity: severityForGap('incomplete_assessment', index, lectures.length),
        });
      } else if (!priorContentCompleted) {
        gaps.push({
          lectureId: lecture.id,
          lectureTitle: lecture.title,
          sectionTitle: lecture.sectionTitle,
          reason: 'incomplete_after_prerequisites',
          severity: severityForGap(
            'incomplete_after_prerequisites',
            index,
            lectures.length,
          ),
        });
      } else {
        const laterCompleted = lectures
          .slice(index + 1)
          .some((item) => item.isCompleted);

        if (laterCompleted) {
          gaps.push({
            lectureId: lecture.id,
            lectureTitle: lecture.title,
            sectionTitle: lecture.sectionTitle,
            reason: 'skipped_lecture',
            severity: severityForGap('skipped_lecture', index, lectures.length),
          });
        }
      }
    }

    if (
      lecture.isCompleted &&
      !ASSESSMENT_TYPES.has(lecture.type) &&
      lecture.timeSpentSeconds > 0 &&
      lecture.timeSpentSeconds < LOW_ENGAGEMENT_SECONDS
    ) {
      gaps.push({
        lectureId: lecture.id,
        lectureTitle: lecture.title,
        sectionTitle: lecture.sectionTitle,
        reason: 'low_engagement',
        severity: severityForGap('low_engagement', index, lectures.length),
      });
    }

    priorContentCompleted = priorContentCompleted && lecture.isCompleted;
  }

  return gaps
    .sort((left, right) => {
      const severityRank: Record<KnowledgeGapSeverity, number> = {
        high: 0,
        medium: 1,
        low: 2,
      };

      return severityRank[left.severity] - severityRank[right.severity];
    })
    .slice(0, 5);
}
