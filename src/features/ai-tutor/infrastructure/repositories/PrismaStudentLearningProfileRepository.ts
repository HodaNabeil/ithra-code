import { prisma } from '@/lib/prisma';

import type {
  StudentLearningProfileRecordDTO,
  StudentLearningProfileRepositoryPort,
} from '../../domain/ports/StudentLearningProfileRepositoryPort';
import type {
  ContentStyle,
  ExplanationDepth,
} from '../../domain/models/StudentLearningProfile';

function mapRecord(record: {
  userId: string;
  courseId: string;
  explanationDepth: string;
  contentStyle: string;
  confidence: number;
  interactionCount: number;
  updatedAt: Date;
}): StudentLearningProfileRecordDTO {
  return {
    userId: record.userId,
    courseId: record.courseId,
    explanationDepth: record.explanationDepth as ExplanationDepth,
    contentStyle: record.contentStyle as ContentStyle,
    confidence: record.confidence,
    interactionCount: record.interactionCount,
    updatedAt: record.updatedAt,
  };
}

export class PrismaStudentLearningProfileRepository
  implements StudentLearningProfileRepositoryPort
{
  async findByUserAndCourse(params: {
    userId: string;
    courseId: string;
  }): Promise<StudentLearningProfileRecordDTO | null> {
    const record = await prisma.studentLearningProfile.findUnique({
      where: {
        userId_courseId: {
          userId: params.userId,
          courseId: params.courseId,
        },
      },
    });

    return record ? mapRecord(record) : null;
  }

  async upsert(
    profile: StudentLearningProfileRecordDTO,
  ): Promise<StudentLearningProfileRecordDTO> {
    const record = await prisma.studentLearningProfile.upsert({
      where: {
        userId_courseId: {
          userId: profile.userId,
          courseId: profile.courseId,
        },
      },
      update: {
        explanationDepth: profile.explanationDepth,
        contentStyle: profile.contentStyle,
        confidence: profile.confidence,
        interactionCount: profile.interactionCount,
      },
      create: {
        userId: profile.userId,
        courseId: profile.courseId,
        explanationDepth: profile.explanationDepth,
        contentStyle: profile.contentStyle,
        confidence: profile.confidence,
        interactionCount: profile.interactionCount,
      },
    });

    return mapRecord(record);
  }
}

export const prismaStudentLearningProfileRepository =
  new PrismaStudentLearningProfileRepository();
