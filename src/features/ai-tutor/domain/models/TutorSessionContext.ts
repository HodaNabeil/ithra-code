/**
 * TutorSessionContext
 *
 * Aggregated session context for a tutoring interaction.
 * Built by CourseContextService before prompt construction.
 */

import type { StudentLearningProfile } from './StudentLearningProfile';
import type {
  AssessmentPerformanceSummary,
  KnowledgeGap,
  LectureProgressItem,
  SectionProgressSummary,
} from './StudentProgressAnalytics';

export type CourseContextInfo = {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription?: string;
  level: string;
  objectives: string[];
  requirements: string[];
  knowledgeIndexed: boolean;
};

export type LectureContextInfo = {
  id: string;
  title: string;
  description?: string;
  sectionTitle: string;
  sectionPosition: number;
  position: number;
  isCompleted: boolean;
};

export type StudentProgressInfo = {
  enrollmentStatus: string;
  completedLectures: number;
  totalLectures: number;
  completionPercentage: number;
  currentLectureCompleted: boolean;
  lectureProgress: LectureProgressItem[];
  sectionProgress: SectionProgressSummary[];
  assessmentPerformance: AssessmentPerformanceSummary;
  knowledgeGaps: KnowledgeGap[];
};

export type LectureCatalogItem = {
  id: string;
  title: string;
  description?: string;
  sectionTitle: string;
};

export type StudentContextInfo = {
  displayName?: string;
  learningLevel: string;
  progressTier: 'start' | 'early' | 'mid' | 'advanced' | 'near_complete';
};

export type TutorSessionContext = {
  courseId: string;
  userId: string;
  lectureId?: string;
  course: CourseContextInfo;
  lecture?: LectureContextInfo;
  student: StudentContextInfo;
  studentProgress: StudentProgressInfo;
  /** Course lecture catalog used for intelligent content suggestions. */
  lectureCatalog: LectureCatalogItem[];
  /** Inferred learning preferences for adaptive responses. */
  learningProfile?: StudentLearningProfile;
};
