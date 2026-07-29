import {
  AskTutorError,
  AskTutorErrorCodes,
} from '../errors/ask-tutor.errors';
import type {
  CourseContextInfo,
  LectureCatalogItem,
  LectureContextInfo,
  StudentProgressInfo,
  TutorSessionContext,
} from '../../domain/models/TutorSessionContext';
import type { LectureProgressItem } from '../../domain/models/StudentProgressAnalytics';
import type {
  CourseContextRepositoryPort,
  EnrolledCourseWithProgressDTO,
} from '../../domain/ports/CourseContextRepositoryPort';
import type { SessionContextCachePort } from '../../domain/ports/SessionContextCachePort';
import { detectKnowledgeGaps } from './knowledge-gap.service';
import {
  analyzeAssessmentPerformance,
  buildSectionProgressSummaries,
} from './student-progress-analytics.service';
import {
  loadStudentLearningProfile,
  type LearningProfileServiceDeps,
} from './learning-profile.service';

export type CourseContextServiceDeps = LearningProfileServiceDeps & {
  courseContextRepository: CourseContextRepositoryPort;
  sessionContextCache: SessionContextCachePort;
};

function getCacheKey(params: {
  userId: string;
  courseSlug: string;
  lectureId?: string;
}): string {
  return `${params.userId}:${params.courseSlug}:${params.lectureId ?? 'general'}`;
}

function findLectureContext(
  course: EnrolledCourseWithProgressDTO,
  lectureId: string,
  completedLectureIds: Set<string>,
): LectureContextInfo | undefined {
  for (const section of course.sections) {
    const lecture = section.lectures.find((item) => item.id === lectureId);
    if (!lecture) {
      continue;
    }

    return {
      id: lecture.id,
      title: lecture.title,
      description: lecture.description ?? undefined,
      sectionTitle: section.title,
      sectionPosition: section.position,
      position: lecture.position,
      isCompleted: completedLectureIds.has(lecture.id),
    };
  }

  return undefined;
}

function buildLectureProgress(params: {
  course: EnrolledCourseWithProgressDTO;
  progressByLectureId: Map<
    string,
    { isCompleted: boolean; timeSpent: number; lastAccessedAt: Date }
  >;
}): LectureProgressItem[] {
  return params.course.sections.flatMap((section) =>
    section.lectures.map((lecture) => {
      const progress = params.progressByLectureId.get(lecture.id);

      return {
        id: lecture.id,
        title: lecture.title,
        sectionTitle: section.title,
        sectionPosition: section.position,
        position: lecture.position,
        type: lecture.type,
        isCompleted: progress?.isCompleted ?? false,
        timeSpentSeconds: progress?.timeSpent ?? 0,
        lastAccessedAt: progress?.lastAccessedAt,
      };
    }),
  );
}

function buildStudentProgress(params: {
  enrollmentStatus: string;
  lectureProgress: LectureProgressItem[];
  currentLectureId?: string;
}): StudentProgressInfo {
  const totalLectures = params.lectureProgress.length;
  const completedLectures = params.lectureProgress.filter(
    (lecture) => lecture.isCompleted,
  ).length;
  const completionPercentage =
    totalLectures === 0
      ? 0
      : Math.round((completedLectures / totalLectures) * 100);
  const knowledgeGaps = detectKnowledgeGaps(params.lectureProgress);

  return {
    enrollmentStatus: params.enrollmentStatus,
    completedLectures,
    totalLectures,
    completionPercentage,
    currentLectureCompleted: params.currentLectureId
      ? (params.lectureProgress.find((lecture) => lecture.id === params.currentLectureId)
          ?.isCompleted ?? false)
      : false,
    lectureProgress: params.lectureProgress,
    sectionProgress: buildSectionProgressSummaries(params.lectureProgress),
    assessmentPerformance: analyzeAssessmentPerformance(params.lectureProgress),
    knowledgeGaps,
  };
}

function mapCourseContext(course: EnrolledCourseWithProgressDTO): CourseContextInfo {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription ?? undefined,
    level: course.level,
    objectives: course.objectives,
    requirements: course.requirements,
  };
}

export async function buildTutorSessionContext(
  params: {
    courseSlug: string;
    userId: string;
    lectureId?: string;
  },
  deps: CourseContextServiceDeps,
): Promise<TutorSessionContext> {
  const cacheKey = getCacheKey(params);
  const cached = await deps.sessionContextCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const course = await deps.courseContextRepository.findEnrolledCourseWithProgress({
    courseSlug: params.courseSlug,
    userId: params.userId,
  });

  if (!course) {
    throw new AskTutorError(
      403,
      'لا يمكنك الوصول إلى مدرس هذه الدورة',
      AskTutorErrorCodes.UNAUTHORIZED,
    );
  }

  const enrollment = course.enrollments[0];
  if (!enrollment) {
    throw new AskTutorError(
      403,
      'لا يمكنك الوصول إلى مدرس هذه الدورة',
      AskTutorErrorCodes.UNAUTHORIZED,
    );
  }

  const progressByLectureId = new Map(
    enrollment.progress.map((item) => [
      item.lectureId,
      {
        isCompleted: item.isCompleted,
        timeSpent: item.timeSpent,
        lastAccessedAt: item.lastAccessedAt,
      },
    ]),
  );
  const lectureProgress = buildLectureProgress({
    course,
    progressByLectureId,
  });
  const lectureCatalog: LectureCatalogItem[] = lectureProgress.map((lecture) => ({
    id: lecture.id,
    title: lecture.title,
    description: undefined,
    sectionTitle: lecture.sectionTitle,
  }));
  const completedLectureIds = new Set(
    lectureProgress
      .filter((lecture) => lecture.isCompleted)
      .map((lecture) => lecture.id),
  );
  const lecture = params.lectureId
    ? findLectureContext(course, params.lectureId, completedLectureIds)
    : undefined;
  const learningProfile = await loadStudentLearningProfile(
    {
      userId: params.userId,
      courseId: course.id,
    },
    deps,
  );

  const sessionContext: TutorSessionContext = {
    courseId: course.id,
    userId: params.userId,
    lectureId: params.lectureId,
    course: mapCourseContext(course),
    lecture,
    studentProgress: buildStudentProgress({
      enrollmentStatus: enrollment.status,
      lectureProgress,
      currentLectureId: params.lectureId,
    }),
    lectureCatalog,
    learningProfile:
      learningProfile.interactionCount > 0 ? learningProfile : undefined,
  };

  await deps.sessionContextCache.set(cacheKey, sessionContext);
  return sessionContext;
}
