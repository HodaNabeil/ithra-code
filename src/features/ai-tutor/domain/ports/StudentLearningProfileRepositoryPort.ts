import type {
  ContentStyle,
  ExplanationDepth,
} from '../models/StudentLearningProfile';

export type StudentLearningProfileRecordDTO = {
  userId: string;
  courseId: string;
  explanationDepth: ExplanationDepth;
  contentStyle: ContentStyle;
  confidence: number;
  interactionCount: number;
  updatedAt: Date;
};

export interface StudentLearningProfileRepositoryPort {
  findByUserAndCourse(params: {
    userId: string;
    courseId: string;
  }): Promise<StudentLearningProfileRecordDTO | null>;

  upsert(profile: StudentLearningProfileRecordDTO): Promise<StudentLearningProfileRecordDTO>;
}
